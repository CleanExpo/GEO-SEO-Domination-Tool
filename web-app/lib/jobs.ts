import { readJSON, writeJSON } from '@/lib/filedb';
import { spawn } from 'node:child_process';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'pathe';

const exec = promisify(execCb);

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
export type JobType = 'build' | 'deploy' | 'api_call';
export type Job = {
  id: string;
  type: JobType;
  workspaceId: string;            // captured at enqueue time
  createdBy?: { email?: string | null; id?: string | null };
  payload: any;                   // action params
  status: JobStatus;
  pct?: number;                   // 0..100
  step?: string;
  logs: string[];
  createdAt: number;
  updatedAt: number;
};

type Store = { jobs: Job[] };
const FILE = 'jobs.json';

function now(){ return Date.now(); }
function repoRoot(){ const WEB_CWD = process.cwd(); return resolve(WEB_CWD, '..', '..'); }
function mcpEntry(){ return join(repoRoot(), 'tools', 'geo-builders-mcp', 'dist', 'index.js'); }

async function load(): Promise<Store>{ return readJSON<Store>(FILE, { jobs: [] }); }
async function save(data: Store){ await writeJSON(FILE, data); }

export async function listJobs(limit = 200): Promise<Job[]>{
  const db = await load();
  return db.jobs.sort((a,b)=> b.updatedAt - a.updatedAt).slice(0, limit);
}

export async function getJob(id: string): Promise<Job | undefined>{
  const db = await load();
  return db.jobs.find(j => j.id === id);
}

export async function enqueueJob(type: JobType, workspaceId: string, payload: any, createdBy?: { email?: string|null; id?: string|null }){
  const job: Job = {
    id: String(Date.now()) + '-' + Math.random().toString(36).slice(2,8),
    type, workspaceId, payload, createdBy,
    status: 'queued', pct: 0, step: 'queued', logs: [],
    createdAt: now(), updatedAt: now()
  };
  const db = await load();
  db.jobs.push(job);
  await save(db);
  startWorker();
  return job;
}

export async function cancelJob(id: string){
  const db = await load();
  const j = db.jobs.find(x => x.id === id);
  if (!j) return false;
  if (j.status === 'running') { j.status = 'canceled'; j.updatedAt = now(); j.logs.push('marked canceled; will stop at next checkpoint'); await save(db); return true; }
  if (j.status === 'queued') { j.status = 'canceled'; j.updatedAt = now(); await save(db); return true; }
  return false;
}

let workerStarted = false; let working = false;
export function startWorker(){ if (workerStarted) return; workerStarted = true; void loop(); }

async function loop(){
  if (working) return; working = true;
  try{
    while (true){
      const db = await load();
      const job = db.jobs.find(j => j.status === 'queued');
      if (!job) { working = false; return; }
      job.status = 'running'; job.step = 'starting'; job.updatedAt = now(); await save(db);
      try{
        if (job.type === 'build') await runBuildJob(job);
        else if (job.type === 'deploy') await runDeployJob(job);
        else await runApiCallJob(job);
        if (job.status !== 'canceled') { job.status = 'succeeded'; job.pct = 100; job.step = 'done'; job.updatedAt = now(); await save(await upsert(job)); }
      }catch(e:any){
        if (job.status !== 'canceled'){
          job.status = 'failed'; job.step = 'error'; job.logs.push(String(e?.message||e)); job.updatedAt = now(); await save(await upsert(job));
        } else { await save(await upsert(job)); }
      }
    }
  } finally { working = false; }
}

async function upsert(updated: Job): Promise<Store>{
  const db = await load();
  const i = db.jobs.findIndex(j => j.id === updated.id);
  if (i >= 0) db.jobs[i] = updated; else db.jobs.push(updated);
  return db;
}

async function runBuildJob(job: Job){
  job.step = 'mcp:run'; job.pct = 20; job.updatedAt = now(); await save(await upsert(job));
  const { action, id, variables, strategy, engine, checks } = job.payload || {};
  if (!action) throw new Error('missing build action');
  const res = await runMcp(action, { id, variables: variables||{}, strategy: strategy||'safe-merge', engine: engine||'eta', checks });
  job.logs.push(JSON.stringify(res));
}

async function runApiCallJob(job: Job){
  job.step = 'execute'; job.pct = 50; job.updatedAt = now(); await save(await upsert(job));
  // placeholder no-op; counted usage only
  job.logs.push('api_call executed');
}

async function runDeployJob(job: Job){
  job.step = 'docker'; job.pct = 30; job.updatedAt = now(); await save(await upsert(job));
  const repo = repoRoot();
  const compose = job.payload?.composePath || join(repo, 'infra', 'docker', 'compose.yml');
  const verb = String(job.payload?.verb || 'up');
  const args = Array.isArray(job.payload?.extraArgs) ? job.payload.extraArgs : [];
  const cmd = ['docker','compose','-f', compose, verb, ...args].join(' ');
  const { stdout, stderr } = await exec(cmd, { windowsHide: true });
  job.logs.push(stdout || ''); if (stderr) job.logs.push(stderr);
}

function runMcp(action: string, payload: any){
  return new Promise<{ ok:boolean; result?:any; error?:string }>((resolveP)=>{
    const child = spawn('node', [mcpEntry()], { stdio: ['pipe','pipe','pipe'] });
    let out = ''; let err = '';
    child.stdout.on('data', (d)=> { out += String(d); });
    child.stderr.on('data', (d)=> { err += String(d); });
    const msg = JSON.stringify({ id: String(Date.now()), tool: action, params: payload }) + '\n';
    child.stdin.write(msg); child.stdin.end();
    child.on('close', ()=>{
      try { const lines = out.trim().split(/\r?\n/); const last = lines[lines.length-1]||'{}'; resolveP(JSON.parse(last)); }
      catch(e:any){ resolveP({ ok:false, error: err || e?.message || 'parse_error' }); }
    });
  });
}
