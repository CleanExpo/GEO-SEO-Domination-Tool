/**
 * GitHub Sync Service
 * Handles GitHub webhook processing and repository synchronisation
 * Phase 3: WEBHOOK-001
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ============================================================
// TYPES
// ============================================================

export interface GitHubRepository {
  id: string;
  organisationId: string;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  defaultBranch: string;
  isPrivate: boolean;
  homepageUrl?: string;
  lastPushAt?: string;
  lastSyncAt?: string;
  webhookSecret?: string;
}

export interface GitHubCommit {
  id: string;
  repositoryId: string;
  sha: string;
  message: string;
  authorName?: string;
  authorEmail?: string;
  committedAt: string;
  branch?: string;
  isMergeCommit: boolean;
}

export interface GitHubPullRequest {
  id: string;
  repositoryId: string;
  githubPrNumber: number;
  githubPrId: number;
  title: string;
  body?: string;
  state: 'open' | 'closed' | 'merged';
  headBranch: string;
  baseBranch: string;
  authorUsername?: string;
  openedAt: string;
  closedAt?: string;
  mergedAt?: string;
  crmTaskId?: string;
}

export interface GitHubIssue {
  id: string;
  repositoryId: string;
  githubIssueNumber: number;
  githubIssueId: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  authorUsername?: string;
  labels: string[];
  openedAt: string;
  closedAt?: string;
  crmTaskId?: string;
}

export interface GitHubRelease {
  id: string;
  repositoryId: string;
  githubReleaseId: number;
  tagName: string;
  releaseName?: string;
  body?: string;
  isPrerelease: boolean;
  isDraft: boolean;
  authorUsername?: string;
  publishedAt?: string;
  changelogGenerated: boolean;
}

// ============================================================
// WEBHOOK PAYLOAD TYPES
// ============================================================

export interface WebhookPushPayload {
  ref: string;
  repository: {
    id: number;
    name: string;
    full_name: string;
    owner: { login: string };
  };
  commits: Array<{
    id: string;
    message: string;
    timestamp: string;
    author: { name: string; email: string };
    committer: { name: string; email: string };
  }>;
  pusher: { name: string };
}

export interface WebhookPullRequestPayload {
  action: 'opened' | 'closed' | 'synchronized' | 'reopened';
  number: number;
  pull_request: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    head: { ref: string };
    base: { ref: string };
    user: { login: string; avatar_url: string };
    created_at: string;
    closed_at?: string;
    merged_at?: string;
  };
  repository: {
    id: number;
    full_name: string;
  };
}

export interface WebhookIssuesPayload {
  action: 'opened' | 'closed' | 'reopened';
  issue: {
    id: number;
    number: number;
    title: string;
    body: string;
    state: string;
    user: { login: string };
    labels: Array<{ name: string }>;
    created_at: string;
    closed_at?: string;
  };
  repository: {
    id: number;
  };
}

export interface WebhookReleasePayload {
  action: 'published' | 'created';
  release: {
    id: number;
    tag_name: string;
    name: string;
    body: string;
    prerelease: boolean;
    draft: boolean;
    author: { login: string };
    published_at: string;
  };
  repository: {
    id: number;
  };
}

// ============================================================
// GITHUB SYNC SERVICE
// ============================================================

export class GitHubSyncService {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // ============================================================
  // WEBHOOK SIGNATURE VERIFICATION
  // ============================================================

  /**
   * Verify GitHub webhook signature
   * @param payload - Raw webhook payload string
   * @param signature - X-Hub-Signature-256 header value
   * @param secret - Webhook secret
   * @returns True if signature is valid
   */
  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !signature.startsWith('sha256=')) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  }

  // ============================================================
  // PUSH EVENT HANDLER
  // ============================================================

  /**
   * Process push webhook event
   * - Extract commits
   * - Update repository metadata
   * - Generate changelog if release branch
   */
  async handlePushEvent(payload: WebhookPushPayload): Promise<void> {
    const repoId = payload.repository.id;

    // Find repository in database
    const { data: repo } = await this.supabase
      .from('github_repositories')
      .select('id')
      .eq('github_repo_id', repoId)
      .single();

    if (!repo) {
      console.warn(`Repository ${repoId} not found in database`);
      return;
    }

    // Extract branch name
    const branch = payload.ref.split('/').pop() || 'unknown';

    // Insert commits
    const commits = payload.commits.map((commit) => ({
      repository_id: repo.id,
      sha: commit.id,
      message: commit.message,
      author_name: commit.author.name,
      author_email: commit.author.email,
      committer_name: commit.committer.name,
      committer_email: commit.committer.email,
      committed_at: commit.timestamp,
      branch,
      is_merge_commit: commit.message.toLowerCase().startsWith('merge'),
    }));

    await this.supabase.from('github_commits').upsert(commits, {
      onConflict: 'repository_id,sha',
      ignoreDuplicates: true,
    });

    // Update repository last_push_at
    await this.supabase
      .from('github_repositories')
      .update({
        last_push_at: new Date().toISOString(),
        default_branch: branch,
      })
      .eq('id', repo.id);

    // Auto-generate changelog if release branch
    if (branch.includes('release/') || branch === 'main') {
      await this.generateChangelog(repo.id, commits);
    }
  }

  // ============================================================
  // PULL REQUEST EVENT HANDLER
  // ============================================================

  /**
   * Process pull request webhook event
   * - Create/update PR record
   * - Create CRM task for new PRs
   * - Link PR to project milestone
   */
  async handlePullRequestEvent(payload: WebhookPullRequestPayload): Promise<void> {
    const repoId = payload.repository.id;

    const { data: repo } = await this.supabase
      .from('github_repositories')
      .select('id, organisation_id')
      .eq('github_repo_id', repoId)
      .single();

    if (!repo) {
      console.warn(`Repository ${repoId} not found`);
      return;
    }

    const pr = payload.pull_request;
    const prData = {
      repository_id: repo.id,
      github_pr_number: pr.number,
      github_pr_id: pr.id,
      title: pr.title,
      body: pr.body,
      state: pr.merged_at ? 'merged' : pr.state,
      head_branch: pr.head.ref,
      base_branch: pr.base.ref,
      author_username: pr.user.login,
      author_avatar_url: pr.user.avatar_url,
      opened_at: pr.created_at,
      closed_at: pr.closed_at,
      merged_at: pr.merged_at,
    };

    // Upsert PR
    const { data: upsertedPR } = await this.supabase
      .from('github_pull_requests')
      .upsert(prData, { onConflict: 'repository_id,github_pr_number' })
      .select()
      .single();

    // Create CRM task for new PRs
    if (payload.action === 'opened' && upsertedPR && !upsertedPR.crm_task_id) {
      await this.createCRMTaskFromPR(repo.organisation_id, upsertedPR);
    }
  }

  // ============================================================
  // ISSUES EVENT HANDLER
  // ============================================================

  /**
   * Process issues webhook event
   * - Create/update issue record
   * - Auto-create CRM task from issue
   */
  async handleIssuesEvent(payload: WebhookIssuesPayload): Promise<void> {
    const repoId = payload.repository.id;

    const { data: repo } = await this.supabase
      .from('github_repositories')
      .select('id, organisation_id')
      .eq('github_repo_id', repoId)
      .single();

    if (!repo) {
      console.warn(`Repository ${repoId} not found`);
      return;
    }

    const issue = payload.issue;
    const issueData = {
      repository_id: repo.id,
      github_issue_number: issue.number,
      github_issue_id: issue.id,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      author_username: issue.user.login,
      labels: issue.labels.map((l) => l.name),
      opened_at: issue.created_at,
      closed_at: issue.closed_at,
    };

    // Upsert issue
    const { data: upsertedIssue } = await this.supabase
      .from('github_issues')
      .upsert(issueData, { onConflict: 'repository_id,github_issue_number' })
      .select()
      .single();

    // Create CRM task for new issues
    if (payload.action === 'opened' && upsertedIssue && !upsertedIssue.crm_task_id) {
      await this.createCRMTaskFromIssue(repo.organisation_id, upsertedIssue);
    }
  }

  // ============================================================
  // RELEASE EVENT HANDLER
  // ============================================================

  /**
   * Process release webhook event
   * - Create release record
   * - Generate changelog entry
   */
  async handleReleaseEvent(payload: WebhookReleasePayload): Promise<void> {
    const repoId = payload.repository.id;

    const { data: repo } = await this.supabase
      .from('github_repositories')
      .select('id')
      .eq('github_repo_id', repoId)
      .single();

    if (!repo) {
      console.warn(`Repository ${repoId} not found`);
      return;
    }

    const release = payload.release;
    const releaseData = {
      repository_id: repo.id,
      github_release_id: release.id,
      tag_name: release.tag_name,
      release_name: release.name,
      body: release.body,
      is_prerelease: release.prerelease,
      is_draft: release.draft,
      author_username: release.author.login,
      published_at: release.published_at,
    };

    // Insert release
    await this.supabase
      .from('github_releases')
      .upsert(releaseData, { onConflict: 'repository_id,tag_name' });

    // Auto-generate changelog
    if (payload.action === 'published' && !release.draft) {
      // Changelog generation logic here
      console.log(`Generating changelog for release ${release.tag_name}`);
    }
  }

  // ============================================================
  // CRM INTEGRATION
  // ============================================================

  /**
   * Create CRM task from pull request
   */
  private async createCRMTaskFromPR(organisationId: string, pr: any): Promise<void> {
    // TODO: Integrate with CRM tasks table
    console.log(`Creating CRM task for PR #${pr.github_pr_number} in org ${organisationId}`);
  }

  /**
   * Create CRM task from issue
   */
  private async createCRMTaskFromIssue(organisationId: string, issue: any): Promise<void> {
    // TODO: Integrate with CRM tasks table
    console.log(`Creating CRM task for issue #${issue.github_issue_number} in org ${organisationId}`);
  }

  /**
   * Generate changelog from commits
   */
  private async generateChangelog(repositoryId: string, commits: any[]): Promise<void> {
    console.log(`Generating changelog for ${commits.length} commits in repo ${repositoryId}`);
    // TODO: Implement changelog generation logic
  }
}
