'use client';
import { useEffect, useMemo, useState } from 'react';

async function apiBuilds(action: string, params: any = {}) { const r = await fetch('/api/builds', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiLink(action: string, params: any = {}) { const r = await fetch('/api/link', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiDeploy(action: string, params: any = {}) { const r = await fetch('/api/deploy', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiSync(action: string, params: any = {}) { const r = await fetch('/api/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiJobs(action: string, params: any = {}) { const r = await fetch('/api/jobs', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }

export default function BuildsPage() {
  const [builders, setBuilders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string>('');
  const [selected, setSelected] = useState<string>('');
  const [routeName, setRouteName] = useState('health');
  const [schemaName, setSchemaName] = useState('events');

  // Linking inputs
  const [ghOwner, setGhOwner] = useState('your-github');
  const [ghRepo, setGhRepo] = useState('geo-seo-demo');
  const [ghPrivate, setGhPrivate] = useState(true);
  const [vzProject, setVzProject] = useState('geo-seo-demo');

  // Local deploy
  const [deployService, setDeployService] = useState('');
  const [deployTail, setDeployTail] = useState('200');

  // SSH settings (compose path used by Sync All job)
  const [sshComposePath, setSshComposePath] = useState('/srv/app/compose.yml');
  const [remotePath, setRemotePath] = useState('/srv/app');

  // Jobs UI
  type Job = { id:string; status:string; pct?:number; step?:string; title?:string; updatedAt:number };
  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeJob, setActiveJob] = useState<string>('');

  useEffect(() => { (async () => { setLoading(true); const j = await fetch('/api/builds').then(r=>r.json()); if (j?.ok && j?.result?.builders) setBuilders(j.result.builders); setLoading(false); })(); }, []);
  useEffect(() => { const t = setInterval(async ()=>{ const r = await fetch('/api/jobs').then(x=>x.json()); setJobs(r?.result?.jobs||[]); }, 2000); return ()=>clearInterval(t); }, []);

  async function doInspect(id: string) { setSelected(id); setLog('Inspecting…'); const j = await apiBuilds('inspect_builder', { id }); setLog(JSON.stringify(j, null, 2)); }
  async function doPreview(id: string) { setSelected(id); setLog('Previewing…'); const v:any={}; if(id==='nextjs-api-route') v.ROUTE_NAME=routeName; if(id==='database-schema') v.SCHEMA_NAME=schemaName; const j=await apiBuilds('preview_apply',{id,engine:'eta',variables:v}); setLog(JSON.stringify(j,null,2)); }
  async function doApply(id: string) { setSelected(id); setLog('Applying…'); const v:any={}; if(id==='nextjs-api-route') v.ROUTE_NAME=routeName; if(id==='database-schema') v.SCHEMA_NAME=schemaName; const j=await apiBuilds('apply_builder',{id,strategy:'safe-merge',engine:'eta',variables:v}); setLog(JSON.stringify(j,null,2)); }
  async function doChecks() { setLog('Running checks…'); const j=await apiBuilds('post_install_check',{checks:['ts','lint','next-build']}); setLog(JSON.stringify(j,null,2)); }

  // Link flows
  async function createGithubRepo() { setLog('Creating GitHub repo…'); const j=await apiLink('github_create_repo',{name:ghRepo,description:'Created from CRM',private:ghPrivate}); setLog(JSON.stringify(j,null,2)); }
  async function linkVercelProject() { setLog('Linking Vercel project…'); const repo=`${ghOwner}/${ghRepo}`; const j=await apiLink('vercel_create_project',{name:vzProject,repo}); setLog(JSON.stringify(j,null,2)); }

  // Local deploy flows
  async function dLocal(action:'config'|'build'|'up'|'down'|'ps'|'logs'){ setLog(`[local] ${action}…`); const params:any={target:'local'}; if(action==='logs'){params.service=deployService;params.tail=deployTail;} const j=await apiDeploy(action,params); setLog(JSON.stringify(j,null,2)); }

  // JOB: Sync All (bundle→scp→unpack→up) with progress
  async function runSyncAllJob(){
    // 1) start job
    const start = await apiJobs('start', { title: 'Sync All (bundle → scp → unpack → up)' });
    if (!start?.ok) { setLog('Failed to start job'); return; }
    const id = start.result.id as string; setActiveJob(id);
    const progress = (pct:number, step:string)=> apiJobs('progress', { id, pct, step });
    const logLine = (line:string)=> apiJobs('log', { id, line });

    try{
      await logLine('Step 1/3: Making and uploading bundle…');
      await progress(10, 'bundling');
      const sync = await apiSync('sync_all', { remotePath, composePath: sshComposePath });
      await logLine(JSON.stringify(sync, null, 2));
      if (!sync?.ok) throw new Error(sync?.error || sync?.stderr || 'sync failed');

      await progress(80, 'compose up');
      await logLine('Compose up done on remote.');
      await progress(100, 'done');
      await apiJobs('complete', { id, result: { remoteBundle: sync?.remoteBundle || null } });
      setLog('Sync All completed.');
    }catch(e:any){
      await apiJobs('fail', { id, error: e?.message || 'unknown error' });
      setLog('Job failed: ' + (e?.message||'unknown'));
    }
  }

  const hasBuilders = useMemo(()=> (builders?.length ?? 0) > 0,[builders]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects → Builds</h1>
        <button className="px-3 py-2 border rounded" onClick={doChecks}>Run Checks</button>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
        {/* Catalog */}
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Builder Catalog</h2>
          {loading && <div>Loading…</div>}
          {!loading && !hasBuilders && <div>No builders found. Ensure /builders has manifests.</div>}
          <ul className="space-y-2">
            {builders.map((b:any)=> (
              <li key={b.id} className={`border rounded p-3 ${selected===b.id?'bg-gray-50':''}`}>
                <div className="font-semibold">{b.title} <span className="text-xs text-gray-500">({b.id})</span></div>
                {b.summary && <div className="text-sm text-gray-600">{b.summary}</div>}
                <div className="mt-2 flex gap-2">
                  <button className="px-2 py-1 border rounded" onClick={()=>{setSelected(b.id); doInspect(b.id);}}>Inspect</button>
                  <button className="px-2 py-1 border rounded" onClick={()=>{setSelected(b.id); doPreview(b.id);}}>Preview</button>
                  <button className="px-2 py-1 border rounded" onClick={()=>{setSelected(b.id); doApply(b.id);}}>Quick Apply</button>
                </div>
                {b.id==='nextjs-api-route' && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <label className="w-28">ROUTE_NAME</label>
                    <input className="border rounded px-2 py-1 w-full" value={routeName} onChange={(e)=>setRouteName(e.target.value)} />
                  </div>
                )}
                {b.id==='database-schema' && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <label className="w-28">SCHEMA_NAME</label>
                    <input className="border rounded px-2 py-1 w-full" value={schemaName} onChange={(e)=>setSchemaName(e.target.value)} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Link + Local Deploy */}
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Link & Local Deploy</h2>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded px-2 py-1" placeholder="GH Owner" value={ghOwner} onChange={e=>setGhOwner(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="Repo" value={ghRepo} onChange={e=>setGhRepo(e.target.value)} />
            </div>
            <div className="flex gap-2 items-center">
              <label className="text-sm">Private?</label>
              <input type="checkbox" checked={ghPrivate} onChange={e=>setGhPrivate(e.target.checked)} />
              <button className="px-2 py-1 border rounded ml-auto" onClick={createGithubRepo}>Create Repo</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className="border rounded px-2 py-1" placeholder="Vercel Project" value={vzProject} onChange={e=>setVzProject(e.target.value)} />
              <button className="px-2 py-1 border rounded" onClick={linkVercelProject}>Link to Vercel</button>
            </div>
            <hr className="my-2" />
            <div className="flex flex-wrap gap-2">
              <button className="px-2 py-1 border rounded" onClick={()=>dLocal('config')}>Compose Config</button>
              <button className="px-2 py-1 border rounded" onClick={()=>dLocal('build')}>Build</button>
              <button className="px-2 py-1 border rounded" onClick={()=>dLocal('up')}>Up</button>
              <button className="px-2 py-1 border rounded" onClick={()=>dLocal('down')}>Down</button>
              <button className="px-2 py-1 border rounded" onClick={()=>dLocal('ps')}>PS</button>
            </div>
          </div>
        </div>

        {/* Jobs Panel */}
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Jobs & Progress</h2>
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-1 gap-2">
              <input className="border rounded px-2 py-1" placeholder="Remote compose path (/srv/app/compose.yml)" value={sshComposePath} onChange={e=>setSshComposePath(e.target.value)} />
              <input className="border rounded px-2 py-1" placeholder="Remote path (/srv/app)" value={remotePath} onChange={e=>setRemotePath(e.target.value)} />
              <button className="px-3 py-2 border rounded" onClick={runSyncAllJob}>Run: Sync All (bundle → scp → unpack → up)</button>
            </div>
            <hr />
            <div className="space-y-2 max-h-80 overflow-auto">
              {jobs.map(j=> (
                <div key={j.id} className="border rounded p-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="font-mono">{j.id}</div>
                    <div className="capitalize">{j.status}</div>
                  </div>
                  <div className="text-xs text-gray-600">{j.step || '—'}</div>
                  <div className="h-2 bg-gray-200 rounded mt-1">
                    <div className="h-2 bg-green-500 rounded" style={{ width: `${j.pct||0}%` }} />
                  </div>
                </div>
              ))}
              {!jobs.length && <div className="text-xs text-gray-500">No jobs yet.</div>}
            </div>
          </div>
          <h3 className="font-medium mt-4">Output</h3>
          <pre className="text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[160px]">{log || 'Ready.'}</pre>
        </div>
      </div>
    </div>
  );
}
