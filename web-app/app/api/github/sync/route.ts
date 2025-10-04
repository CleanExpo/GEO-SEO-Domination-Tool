import { NextRequest, NextResponse } from 'next/server';
import { getGitHubSyncService } from '@/services/github/sync';
import { z } from 'zod';

const syncRequestSchema = z.object({
  github_project_id: z.number().int().positive(),
  sync_metadata: z.boolean().default(true),
  sync_commits: z.boolean().default(false),
  sync_pull_requests: z.boolean().default(false),
  sync_issues: z.boolean().default(false),
  since: z.string().optional(), // ISO 8601 timestamp
  token: z.string().optional(), // Custom GitHub token
});

// POST /api/github/sync - Trigger manual sync for a repository
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = syncRequestSchema.parse(body);

    const syncService = getGitHubSyncService(validatedData.token);

    const result = await syncService.syncRepository(
      validatedData.github_project_id,
      {
        syncMetadata: validatedData.sync_metadata,
        syncCommits: validatedData.sync_commits,
        syncPullRequests: validatedData.sync_pull_requests,
        syncIssues: validatedData.sync_issues,
        since: validatedData.since,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Repository synced successfully',
      items_synced: result.itemsSynced,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync repository' },
      { status: 500 }
    );
  }
}

// GET /api/github/sync - Get sync job history for a repository
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const githubProjectId = searchParams.get('github_project_id');

    if (!githubProjectId) {
      return NextResponse.json(
        { error: 'github_project_id is required' },
        { status: 400 }
      );
    }

    const { createClient } = await import('@/lib/auth/supabase-server');
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('github_sync_jobs')
      .select('*')
      .eq('github_project_id', parseInt(githubProjectId))
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sync_jobs: data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sync history' },
      { status: 500 }
    );
  }
}
