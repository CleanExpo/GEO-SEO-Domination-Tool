/**
 * GitHub Repository Sync Service
 *
 * Handles automatic syncing of GitHub repository data including:
 * - Repository metadata (stars, forks, issues)
 * - Commits
 * - Pull requests
 * - Issues
 */

import { getGitHubClient } from '../api/github';
import { createClient } from '@/lib/auth/supabase-server';

interface SyncOptions {
  syncMetadata?: boolean;
  syncCommits?: boolean;
  syncPullRequests?: boolean;
  syncIssues?: boolean;
  since?: string; // ISO 8601 timestamp for incremental sync
}

export class GitHubSyncService {
  private githubClient;
  private supabase;

  constructor(token?: string) {
    this.githubClient = getGitHubClient(token);
  }

  async initialize() {
    this.supabase = await createClient();
  }

  /**
   * Sync a single repository
   */
  async syncRepository(
    githubProjectId: number,
    options: SyncOptions = {}
  ): Promise<{ success: boolean; itemsSynced: number; error?: string }> {
    await this.initialize();

    const startTime = Date.now();
    let itemsSynced = 0;

    try {
      // Get project details
      const { data: project, error: projectError } = await this.supabase
        .from('crm_github_projects')
        .select('*')
        .eq('id', githubProjectId)
        .single();

      if (projectError || !project) {
        throw new Error('GitHub project not found');
      }

      // Extract owner and repo from URL
      const match = project.url.match(/github\.com\/([\w-]+)\/([\w-]+)/);
      if (!match) {
        throw new Error('Invalid GitHub URL');
      }

      const [, owner, repo] = match;

      // Create sync job record
      const { data: syncJob } = await this.supabase
        .from('github_sync_jobs')
        .insert([
          {
            github_project_id: githubProjectId,
            sync_type: 'full',
            status: 'running',
          },
        ])
        .select()
        .single();

      // Update project sync status
      await this.supabase
        .from('crm_github_projects')
        .update({ sync_status: 'syncing' })
        .eq('id', githubProjectId);

      // Sync metadata (always)
      if (options.syncMetadata !== false) {
        const count = await this.syncMetadata(githubProjectId, owner, repo);
        itemsSynced += count;
      }

      // Sync commits
      if (options.syncCommits) {
        const count = await this.syncCommits(
          githubProjectId,
          owner,
          repo,
          options.since
        );
        itemsSynced += count;
      }

      // Sync pull requests
      if (options.syncPullRequests) {
        const count = await this.syncPullRequests(githubProjectId, owner, repo);
        itemsSynced += count;
      }

      // Sync issues
      if (options.syncIssues) {
        const count = await this.syncIssues(githubProjectId, owner, repo);
        itemsSynced += count;
      }

      // Update sync job as successful
      if (syncJob) {
        await this.supabase
          .from('github_sync_jobs')
          .update({
            status: 'success',
            completed_at: new Date().toISOString(),
            duration_ms: Date.now() - startTime,
            items_synced: itemsSynced,
          })
          .eq('id', syncJob.id);
      }

      // Update project sync status
      await this.supabase
        .from('crm_github_projects')
        .update({
          sync_status: 'success',
          last_synced_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq('id', githubProjectId);

      return { success: true, itemsSynced };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update project sync status as failed
      await this.supabase
        .from('crm_github_projects')
        .update({
          sync_status: 'failed',
          sync_error: errorMessage,
        })
        .eq('id', githubProjectId);

      return { success: false, itemsSynced, error: errorMessage };
    }
  }

  /**
   * Sync repository metadata (stars, forks, language, etc.)
   */
  private async syncMetadata(
    githubProjectId: number,
    owner: string,
    repo: string
  ): Promise<number> {
    const repoData = await this.githubClient.getRepository(owner, repo);

    await this.supabase
      .from('crm_github_projects')
      .update({
        owner,
        repo_name: repoData.name,
        github_id: repoData.id,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.watchers_count,
        open_issues: repoData.open_issues_count,
        language: repoData.language,
        default_branch: repoData.default_branch,
        is_private: repoData.private,
        is_fork: repoData.fork,
        is_archived: repoData.archived,
        size_kb: repoData.size,
        license: repoData.license?.key,
        topics: repoData.topics || [],
        last_updated: repoData.updated_at,
      })
      .eq('id', githubProjectId);

    return 1;
  }

  /**
   * Sync recent commits
   */
  private async syncCommits(
    githubProjectId: number,
    owner: string,
    repo: string,
    since?: string
  ): Promise<number> {
    const commits = await this.githubClient.getCommits(owner, repo, {
      since,
      per_page: 100,
    });

    let syncedCount = 0;

    for (const commit of commits) {
      try {
        // Get full commit details for stats
        const fullCommit = await this.githubClient.getCommit(owner, repo, commit.sha);

        await this.supabase.from('github_commits').upsert(
          [
            {
              github_project_id: githubProjectId,
              commit_sha: commit.sha,
              author_name: commit.commit.author.name,
              author_email: commit.commit.author.email,
              author_username: commit.author?.login,
              commit_message: commit.commit.message,
              commit_date: commit.commit.author.date,
              additions: fullCommit.stats?.additions || 0,
              deletions: fullCommit.stats?.deletions || 0,
              files_changed: fullCommit.files?.length || 0,
            },
          ],
          { onConflict: 'github_project_id,commit_sha' }
        );

        syncedCount++;
      } catch (err) {
        console.warn(`Failed to sync commit ${commit.sha}:`, err);
      }
    }

    return syncedCount;
  }

  /**
   * Sync pull requests
   */
  private async syncPullRequests(
    githubProjectId: number,
    owner: string,
    repo: string
  ): Promise<number> {
    // Sync both open and recently closed PRs
    const [openPRs, closedPRs] = await Promise.all([
      this.githubClient.getPullRequests(owner, repo, { state: 'open', per_page: 100 }),
      this.githubClient.getPullRequests(owner, repo, {
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 50,
      }),
    ]);

    const allPRs = [...openPRs, ...closedPRs];
    let syncedCount = 0;

    for (const pr of allPRs) {
      try {
        // Get full PR details for stats
        const fullPR = await this.githubClient.getPullRequest(owner, repo, pr.number);

        await this.supabase.from('github_pull_requests').upsert(
          [
            {
              github_project_id: githubProjectId,
              pr_number: pr.number,
              title: pr.title,
              body: pr.body,
              state: pr.state,
              author_username: pr.user.login,
              head_branch: pr.head.ref,
              base_branch: pr.base.ref,
              created_at: pr.created_at,
              updated_at: pr.updated_at,
              closed_at: pr.closed_at,
              merged_at: pr.merged_at,
              additions: fullPR.additions,
              deletions: fullPR.deletions,
              changed_files: fullPR.changed_files,
              comments_count: fullPR.comments,
            },
          ],
          { onConflict: 'github_project_id,pr_number' }
        );

        syncedCount++;
      } catch (err) {
        console.warn(`Failed to sync PR #${pr.number}:`, err);
      }
    }

    // Update open_prs count
    await this.supabase
      .from('crm_github_projects')
      .update({ open_prs: openPRs.length })
      .eq('id', githubProjectId);

    return syncedCount;
  }

  /**
   * Sync issues
   */
  private async syncIssues(
    githubProjectId: number,
    owner: string,
    repo: string
  ): Promise<number> {
    // Sync both open and recently closed issues
    const [openIssues, closedIssues] = await Promise.all([
      this.githubClient.getIssues(owner, repo, { state: 'open', per_page: 100 }),
      this.githubClient.getIssues(owner, repo, {
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: 50,
      }),
    ]);

    const allIssues = [...openIssues, ...closedIssues];
    let syncedCount = 0;

    for (const issue of allIssues) {
      try {
        await this.supabase.from('github_issues').upsert(
          [
            {
              github_project_id: githubProjectId,
              issue_number: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              author_username: issue.user.login,
              assignees: issue.assignees.map((a) => a.login),
              labels: issue.labels.map((l) => ({ name: l.name, color: l.color })),
              created_at: issue.created_at,
              updated_at: issue.updated_at,
              closed_at: issue.closed_at,
              comments_count: issue.comments,
            },
          ],
          { onConflict: 'github_project_id,issue_number' }
        );

        syncedCount++;
      } catch (err) {
        console.warn(`Failed to sync issue #${issue.number}:`, err);
      }
    }

    return syncedCount;
  }

  /**
   * Sync all repositories with auto_sync enabled
   */
  async syncAll(): Promise<void> {
    await this.initialize();

    const { data: projects } = await this.supabase
      .from('crm_github_projects')
      .select('*')
      .eq('auto_sync', true)
      .not('sync_status', 'eq', 'syncing'); // Skip currently syncing projects

    if (!projects || projects.length === 0) {
      console.log('No projects with auto-sync enabled');
      return;
    }

    console.log(`Syncing ${projects.length} repositories...`);

    for (const project of projects) {
      try {
        await this.syncRepository(project.id, {
          syncMetadata: true,
          syncCommits: true,
          syncPullRequests: true,
          syncIssues: true,
        });
        console.log(`✅ Synced ${project.name}`);
      } catch (error) {
        console.error(`❌ Failed to sync ${project.name}:`, error);
      }
    }
  }
}

// Singleton instance
let syncService: GitHubSyncService | null = null;

export function getGitHubSyncService(token?: string): GitHubSyncService {
  if (!syncService || token) {
    syncService = new GitHubSyncService(token);
  }
  return syncService;
}
