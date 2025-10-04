import { readJSON, writeJSON } from '@/lib/filedb';

export type UsageType = 'api_call' | 'build' | 'deploy' | 'audit' | 'ranking_check';

export interface UsageRecord {
  workspaceId: string;
  type: UsageType;
  amount: number;
  metadata?: any;
  timestamp: number;
}

export interface UsageQuota {
  allowed: boolean;
  remaining: number;
  cap: number;
}

const DEFAULT_QUOTAS: Record<UsageType, number> = {
  api_call: 1000,
  build: 100,
  deploy: 50,
  audit: 200,
  ranking_check: 500,
};

export async function checkQuota(
  workspaceId: string,
  type: UsageType,
  amount: number = 1
): Promise<UsageQuota> {
  const db = await readJSON<{ usage: UsageRecord[] }>('usage.json', { usage: [] });

  // Get usage for this workspace and type in the current month
  const now = Date.now();
  const monthStart = new Date(new Date(now).setDate(1)).setHours(0, 0, 0, 0);

  const currentUsage = db.usage
    .filter(u =>
      u.workspaceId === workspaceId &&
      u.type === type &&
      u.timestamp >= monthStart
    )
    .reduce((sum, u) => sum + u.amount, 0);

  const cap = DEFAULT_QUOTAS[type] || 1000;
  const remaining = Math.max(0, cap - currentUsage);
  const allowed = currentUsage + amount <= cap;

  return { allowed, remaining, cap };
}

export async function recordUsage(
  workspaceId: string,
  type: UsageType,
  amount: number = 1,
  metadata?: any
): Promise<void> {
  const db = await readJSON<{ usage: UsageRecord[] }>('usage.json', { usage: [] });

  const record: UsageRecord = {
    workspaceId,
    type,
    amount,
    metadata,
    timestamp: Date.now(),
  };

  db.usage.push(record);
  await writeJSON('usage.json', db);
}

export async function getUsageStats(workspaceId: string, type?: UsageType) {
  const db = await readJSON<{ usage: UsageRecord[] }>('usage.json', { usage: [] });

  const now = Date.now();
  const monthStart = new Date(new Date(now).setDate(1)).setHours(0, 0, 0, 0);

  let filtered = db.usage.filter(u =>
    u.workspaceId === workspaceId &&
    u.timestamp >= monthStart
  );

  if (type) {
    filtered = filtered.filter(u => u.type === type);
  }

  const totalUsage = filtered.reduce((sum, u) => sum + u.amount, 0);
  const byType = filtered.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + u.amount;
    return acc;
  }, {} as Record<UsageType, number>);

  return { totalUsage, byType };
}
