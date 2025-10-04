/* Redis worker: run with `npm run worker` (requires REDIS_URL and project repo env). */
import { spawn } from 'node:child_process';
import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'pathe';
import { popNext, updateJob, quotaOrThrow, recordUsageOk, type Job } from '../../web-app/lib/redisq';

const exec = promisify(execCb);

function repoRoot(){ const WEB_CWD = process.cwd(); return resolve(WEB_CWD); }
function mcpEntry(){ return join(repoRoot(), 'tools', 'geo-builders-mcp', 'dist', 'index.js'); }

async function runMcp(action: string, payload: any){
  return new Promise<{ ok:boolean; result?:any; error?:string }>((resolveP)=>{
    const child = spawn('node', [mcpEntry()], { stdio: ['pipe','pipe','pipe'] });
    let out = ''; let err = '';
    child.stdout.on('data', d=> out += String(d));
    child.stderr.on('data', d=> err += String(d));
    child.stdin.write(JSON.stringify({ id: String(Date.now()), tool: action, params: payload }) + '\n');
    child.stdin.end();
    child.on('close', ()=>{ try{ const j = JSON.parse(out.trim().split(/\r?\n/).pop()||'{}'); resolveP(j); } catch(e:any){ resolveP({ ok:false, error: err || e?.message||'parse_error' }); } });
  });
}

async function runDeploy(cmd: string){ return exec(cmd, { windowsHide: true }); }

async function handle(job: Job){
  if (job.status === 'canceled') return;
  await quotaOrThrow(job);
  if (job.type === 'build'){
    job.status='running'; job.step='mcp:run'; job.pct=20; await updateJob(job);
    const { action, id, variables, strategy, engine, checks } = job.payload || {};
    const res = await runMcp(action, { id, variables: variables||{}, strategy: strategy||'safe-merge', engine: engine||'eta', checks });
    job.logs.push(JSON.stringify(res)); job.pct=70; job.step = res.ok ? 'mcp:ok' : 'mcp:error'; await updateJob(job);
    await recordUsageOk(job);
    if (!res.ok) throw new Error(res.error||'mcp_failed');
  } else if (job.type === 'deploy'){
    job.status='running'; job.step='docker'; job.pct=30; await updateJob(job);
    const compose = job.payload?.composePath || join(repoRoot(), 'infra', 'docker', 'compose.yml');
    const verb = String(job.payload?.verb || 'up');
    const args = Array.isArray(job.payload?.extraArgs) ? job.payload.extraArgs : [];
    const cmd = ['docker','compose','-f', compose, verb, ...args].join(' ');
    const { stdout, stderr } = await runDeploy(cmd);
    if (stdout) job.logs.push(stdout); if (stderr) job.logs.push(stderr);
    await recordUsageOk(job);
  } else {
    job.status='running'; job.step='api'; job.pct=50; await updateJob(job);
    await recordUsageOk(job);
  }
  job.pct = 100; job.step='done'; job.status='succeeded'; await updateJob(job);
}

async function main(){
  if (!process.env.REDIS_URL){ console.error('REDIS_URL not set; worker idle'); process.exit(1); }
  console.log('redis-worker online');
  // Simple forever loop
  // eslint-disable-next-line no-constant-condition
  while (true){
    try{
      const job = await popNext(['build','deploy','api_call']);
      if (!job){ await new Promise(r=> setTimeout(r, 500)); continue; }
      try{ await handle(job); }
      catch(e:any){ job.status = job.status==='canceled' ? 'canceled' : 'failed'; job.step='error'; job.logs.push(String(e?.message||e)); await updateJob(job); }
    }catch(e){ await new Promise(r=> setTimeout(r, 1000)); }
  }
}

main().catch(()=> process.exit(1));
