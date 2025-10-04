import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { createHmac } from 'crypto';

/**
 * GitHub Webhook Handler
 *
 * Receives webhook events from GitHub and updates repository data in real-time
 * Supported events: push, pull_request, issues, star, fork, release
 */

// Verify GitHub webhook signature
function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!signature) return false;

  const hmac = createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return signature === digest;
}

// Parse repository URL to get owner and repo
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([\w-]+)\/([\w-]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const event = request.headers.get('x-github-event');
    const delivery = request.headers.get('x-github-delivery');

    // Read raw body for signature verification
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);

    // Verify webhook secret (optional but recommended)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifySignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    console.log(`[GitHub Webhook] Received ${event} event (${delivery})`);

    // Find the GitHub project in our database
    const supabase = await createClient();
    const repoFullName = payload.repository?.full_name;

    if (!repoFullName) {
      return NextResponse.json(
        { error: 'Repository not found in payload' },
        { status: 400 }
      );
    }

    const repoUrl = `https://github.com/${repoFullName}`;

    const { data: project } = await supabase
      .from('crm_github_projects')
      .select('*')
      .eq('url', repoUrl)
      .single();

    if (!project) {
      console.log(`[GitHub Webhook] Repository ${repoFullName} not tracked`);
      return NextResponse.json({ message: 'Repository not tracked' });
    }

    // Handle different event types
    switch (event) {
      case 'push':
        await handlePushEvent(project.id, payload, supabase);
        break;

      case 'pull_request':
        await handlePullRequestEvent(project.id, payload, supabase);
        break;

      case 'issues':
        await handleIssuesEvent(project.id, payload, supabase);
        break;

      case 'star':
        await handleStarEvent(project.id, payload, supabase);
        break;

      case 'fork':
        await handleForkEvent(project.id, payload, supabase);
        break;

      case 'release':
        await handleReleaseEvent(project.id, payload, supabase);
        break;

      default:
        console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
    }

    // Update webhook delivery tracking
    await supabase
      .from('github_webhooks')
      .update({
        last_delivery_at: new Date().toISOString(),
        delivery_count: supabase.raw('delivery_count + 1'),
      })
      .eq('github_project_id', project.id);

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('[GitHub Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle push event (new commits)
async function handlePushEvent(projectId: number, payload: any, supabase: any) {
  const commits = payload.commits || [];

  for (const commit of commits) {
    await supabase.from('github_commits').upsert(
      [
        {
          github_project_id: projectId,
          commit_sha: commit.id,
          author_name: commit.author?.name,
          author_email: commit.author?.email,
          author_username: commit.author?.username,
          commit_message: commit.message,
          commit_date: commit.timestamp,
          additions: commit.added?.length || 0,
          deletions: commit.removed?.length || 0,
          files_changed: commit.modified?.length || 0,
        },
      ],
      { onConflict: 'github_project_id,commit_sha' }
    );
  }

  console.log(`[GitHub Webhook] Recorded ${commits.length} commits`);
}

// Handle pull request events
async function handlePullRequestEvent(projectId: number, payload: any, supabase: any) {
  const pr = payload.pull_request;

  await supabase.from('github_pull_requests').upsert(
    [
      {
        github_project_id: projectId,
        pr_number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state,
        author_username: pr.user?.login,
        head_branch: pr.head?.ref,
        base_branch: pr.base?.ref,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        closed_at: pr.closed_at,
        merged_at: pr.merged_at,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changed_files,
        comments_count: pr.comments,
      },
    ],
    { onConflict: 'github_project_id,pr_number' }
  );

  // Update open PRs count
  const { count } = await supabase
    .from('github_pull_requests')
    .select('*', { count: 'exact', head: true })
    .eq('github_project_id', projectId)
    .eq('state', 'open');

  await supabase
    .from('crm_github_projects')
    .update({ open_prs: count || 0 })
    .eq('id', projectId);

  console.log(`[GitHub Webhook] Updated PR #${pr.number}`);
}

// Handle issues events
async function handleIssuesEvent(projectId: number, payload: any, supabase: any) {
  const issue = payload.issue;

  // Skip if it's a pull request (GitHub sends issues events for PRs too)
  if (issue.pull_request) return;

  await supabase.from('github_issues').upsert(
    [
      {
        github_project_id: projectId,
        issue_number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        author_username: issue.user?.login,
        assignees: issue.assignees?.map((a: any) => a.login) || [],
        labels: issue.labels?.map((l: any) => ({ name: l.name, color: l.color })) || [],
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        closed_at: issue.closed_at,
        comments_count: issue.comments,
      },
    ],
    { onConflict: 'github_project_id,issue_number' }
  );

  // Update open issues count
  const { count } = await supabase
    .from('github_issues')
    .select('*', { count: 'exact', head: true })
    .eq('github_project_id', projectId)
    .eq('state', 'open');

  await supabase
    .from('crm_github_projects')
    .update({ open_issues: count || 0 })
    .eq('id', projectId);

  console.log(`[GitHub Webhook] Updated issue #${issue.number}`);
}

// Handle star events
async function handleStarEvent(projectId: number, payload: any, supabase: any) {
  const action = payload.action; // created or deleted
  const repository = payload.repository;

  if (action === 'created' || action === 'deleted') {
    await supabase
      .from('crm_github_projects')
      .update({ stars: repository.stargazers_count })
      .eq('id', projectId);

    console.log(`[GitHub Webhook] Star ${action}: ${repository.stargazers_count} total`);
  }
}

// Handle fork events
async function handleForkEvent(projectId: number, payload: any, supabase: any) {
  const repository = payload.repository;

  await supabase
    .from('crm_github_projects')
    .update({ forks: repository.forks_count })
    .eq('id', projectId);

  console.log(`[GitHub Webhook] Forked: ${repository.forks_count} total`);
}

// Handle release events
async function handleReleaseEvent(projectId: number, payload: any, supabase: any) {
  const release = payload.release;

  console.log(`[GitHub Webhook] Release ${payload.action}: ${release.tag_name}`);
  // Could store releases in a separate table if needed
}

// GET endpoint for webhook verification (GitHub sends GET requests to verify URLs)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'GitHub webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
