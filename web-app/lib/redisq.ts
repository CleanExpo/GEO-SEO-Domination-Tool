import { randomUUID } from 'node:crypto';
import { readJSON, writeJSON } from '@/lib/filedb';
import { checkQuota, recordUsage } from '@/lib/usage';

// Lightweight client using fetch to Redis REST is out of scope; use ioredis if REDIS_URL is present.
// We code-split require to avoid ESM issues on Windows.
// IMPORTANT: ioredis is OPTIONAL - system falls back to file-based storage gracefully
let Redis: any = null;
function getRedis(){
  // If no REDIS_URL configured, use file-based storage (no error)
  if (!process.env.REDIS_URL) return null;

  if (!Redis) {
    try {
      // Dynamic require - if ioredis not installed, gracefully fallback
      Redis = require('ioredis');
    } catch (e) {
      console.warn('[REDISQ] ioredis not installed, using file-based storage (this is fine for dev)');
      return null;
    }
  }
  try {
    return new Redis(process.env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 2 });
  } catch (e) {
    console.error('[REDISQ] Failed to initialize Redis, falling back to file-based storage:', e);
    return null;
  }
}

export type JobStatus = 'queued'|'running'|'succeeded'|'failed'|'canceled';
export type JobType = 'build'|'deploy'|'api_call';
export type Job = { id: string; type: JobType; workspaceId: string; payload: any; createdBy?: { id?: string|null; email?: string|null }; status: JobStatus; pct?: number; step?: string; logs: string[]; createdAt: number; updatedAt: number };

// Redis keys
const K = {
  q: (t: JobType)=> `jobs:q:${t}`,      // list (LPUSH/RPOP)
  job: (id: string)=> `jobs:item:${id}`, // hash/json
  idx: 'jobs:index'                      // zset by updatedAt
};

async function fileList(){ const db = await readJSON<{jobs:Job[]}>('jobs.json', { jobs: [] }); return db.jobs.sort((a,b)=> b.updatedAt - a.updatedAt); }
async function fileUpsert(j: Job){ const db = await readJSON<{jobs:Job[]}>('jobs.json', { jobs: [] }); const i = db.jobs.findIndex(x=> x.id===j.id); if (i>=0) db.jobs[i]=j; else db.jobs.push(j); await writeJSON('jobs.json', db); }

export async function listJobs(limit=200){
  const r = getRedis();
  if (!r) return (await fileList()).slice(0, limit);
  const ids = await r.zrevrange(K.idx, 0, limit-1);
  if (!ids?.length) return [];
  const pipe = r.pipeline(); ids.forEach((id:string)=> pipe.get(K.job(id))); const res = await pipe.exec();
  return res.map(([,json]: any)=> JSON.parse(json)).filter(Boolean);
}

export async function getJob(id: string){
  const r = getRedis();
  if (!r){ const list = await fileList(); return list.find(j=> j.id===id); }
  const json = await r.get(K.job(id));
  return json ? JSON.parse(json) as Job : undefined;
}

export async function enqueueJob(type: JobType, workspaceId: string, payload: any, createdBy?: { id?: string|null; email?: string|null }){
  const job: Job = { id: randomUUID(), type, workspaceId, payload, createdBy, status: 'queued', pct: 0, step: 'queued', logs: [], createdAt: Date.now(), updatedAt: Date.now() };
  const r = getRedis();
  if (!r){ await fileUpsert(job); return job; }
  const key = K.q(type);
  await r.set(K.job(job.id), JSON.stringify(job));
  await r.lpush(key, job.id);
  await r.zadd(K.idx, Date.now(), job.id);
  return job;
}

export async function updateJob(job: Job){
  const r = getRedis();
  job.updatedAt = Date.now();
  if (!r){ await fileUpsert(job); return; }
  await r.set(K.job(job.id), JSON.stringify(job));
  await r.zadd(K.idx, job.updatedAt, job.id);
}

export async function popNext(types: JobType[]): Promise<Job|null>{
  const r = getRedis();
  if (!r) return null; // worker only operates with Redis
  // Try each queue in round-robin
  for (const t of types){
    const id = await r.rpop(K.q(t));
    if (id){ const json = await r.get(K.job(id)); return json ? JSON.parse(json) as Job : null; }
  }
  return null;
}

export async function cancelJob(id: string){
  const r = getRedis();
  const j = await getJob(id);
  if (!j) return false;
  if (j.status === 'queued' || j.status === 'running'){ j.status = 'canceled'; await updateJob(j); return true; }
  return false;
}

export async function quotaOrThrow(job: Job){
  const inc = 1; const q = await checkQuota(job.workspaceId, job.type as any, inc);
  if (!q.allowed) throw new Error(`quota_exceeded:${job.type} remaining=${q.remaining} cap=${q.cap}`);
}

export async function recordUsageOk(job: Job){ try { await recordUsage(job.workspaceId, job.type as any, 1, { jobId: job.id, step: job.step }); } catch {} }
