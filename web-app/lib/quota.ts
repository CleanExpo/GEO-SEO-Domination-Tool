import { NextRequest } from 'next/server';
import { checkQuota, recordUsage, UsageType } from '@/lib/usage';
import { readJSON, writeJSON } from '@/lib/filedb';

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuotaGate {
  ok: boolean;
  status: number;
  body: any;
  ws?: Workspace;
}

// Get workspace from request (simple implementation)
async function getWorkspaceFromRequest(req: NextRequest): Promise<Workspace | null> {
  // Try to get workspace ID from headers or query
  const workspaceId = req.headers.get('x-workspace-id') ||
                      new URL(req.url).searchParams.get('workspaceId') ||
                      'default';

  const db = await readJSON<{ workspaces: Workspace[] }>('workspaces.json', { workspaces: [] });

  let workspace = db.workspaces.find(w => w.id === workspaceId);

  if (!workspace) {
    // Create default workspace
    workspace = {
      id: workspaceId,
      name: workspaceId === 'default' ? 'Default Workspace' : workspaceId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    db.workspaces.push(workspace);
    await writeJSON('workspaces.json', db);
  }

  return workspace;
}

export async function ensureCapsForActiveWorkspace(req: NextRequest): Promise<void> {
  // Ensure workspace exists
  await getWorkspaceFromRequest(req);
}

export async function enforceQuota(
  req: NextRequest,
  type: UsageType,
  amount: number = 1
): Promise<QuotaGate> {
  const workspace = await getWorkspaceFromRequest(req);

  if (!workspace) {
    return {
      ok: false,
      status: 401,
      body: { ok: false, error: 'Workspace not found' },
    };
  }

  const quota = await checkQuota(workspace.id, type, amount);

  if (!quota.allowed) {
    return {
      ok: false,
      status: 429,
      body: {
        ok: false,
        error: 'Quota exceeded',
        remaining: quota.remaining,
        cap: quota.cap,
      },
      ws: workspace,
    };
  }

  return {
    ok: true,
    status: 200,
    body: { ok: true },
    ws: workspace,
  };
}

export async function recordOk(
  workspace: Workspace,
  type: UsageType,
  amount: number = 1,
  metadata?: any
): Promise<void> {
  await recordUsage(workspace.id, type, amount, metadata);
}
