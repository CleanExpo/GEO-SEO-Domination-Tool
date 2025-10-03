'use client';
import { useEffect, useMemo, useState } from 'react';

async function apiBuilds(action: string, params: any = {}) { const r = await fetch('/api/builds', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiLink(action: string, params: any = {}) { const r = await fetch('/api/link', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiDeploy(action: string, params: any = {}) { const r = await fetch('/api/deploy', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }
async function apiSync(action: string, params: any = {}) { const r = await fetch('/api/sync', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) }); return r.json(); }

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

  // Conflicts plan
  type Row = { to: string; status: 'new'|'identical'|'modify'; decision: 'write'|'skip'; diff?: string };
  const [planRows, setPlanRows] = useState<Row[]>([]);

  useEffect(() => { (async () => { setLoading(true); const j = await fetch('/api/builds').then(r=>r.json()); if (j?.ok && j?.result?.builders) setBuilders(j.result.builders); setLoading(false); })(); }, []);

  async function doInspect(id: string) { setSelected(id); setLog('Inspecting…'); const j = await apiBuilds('inspect_builder', { id }); setLog(JSON.stringify(j, null, 2)); }
  async function doPreview(id: string) { setSelected(id); setLog('Previewing…'); const v:any={}; if(id==='nextjs-api-route') v.ROUTE_NAME=routeName; if(id==='database-schema') v.SCHEMA_NAME=schemaName; const j=await apiBuilds('preview_apply',{id,engine:'eta',variables:v}); setLog(JSON.stringify(j,null,2)); }
  async function doApply(id: string) { setSelected(id); setLog('Applying…'); const v:any={}; if(id==='nextjs-api-route') v.ROUTE_NAME=routeName; if(id==='database-schema') v.SCHEMA_NAME=schemaName; const j=await apiBuilds('apply_builder',{id,strategy:'safe-merge',engine:'eta',variables:v}); setLog(JSON.stringify(j,null,2)); }
  async function doChecks() { setLog('Running checks…'); const j=await apiBuilds('post_install_check',{checks:['ts','lint','next-build']}); setLog(JSON.stringify(j,null,2)); }

  // Link flows
  async function createGithubRepo() { setLog('Creating GitHub repo…'); const j=await apiLink('github_create_repo',{name:ghRepo,description:'Created from CRM',private:ghPrivate}); setLog(JSON.stringify(j,null,2)); }
  async function linkVercelProject() { setLog('Linking Vercel project…'); const repo=`${ghOwner}/${ghRepo}`; const j=await apiLink('vercel_create_project',{name:vzProject,repo}); setLog(JSON.stringify(j,null,2)); }

  // Conflicts & Plan
  function variablesFor(id: string) { const v:any={}; if(id==='nextjs-api-route') v.ROUTE_NAME=routeName; if(id==='database-schema') v.SCHEMA_NAME=schemaName; return v; }
  async function previewConflicts() {
    if (!selected) { setLog('Pick a builder first.'); return; }
    setLog('Previewing conflicts…');
    const j = await apiBuilds('preview_conflicts', { id:selected, engine:'eta', variables: variablesFor(selected) });
    const rows: Row[] = (j?.result?.files||[]).map((f:any)=> ({ to: f.to, status: f.status, decision: f.status==='identical'?'skip':'write', diff: f.diff||'' }));
    setPlanRows(rows);
    setLog(JSON.stringify(j,null,2));
  }
  function setDecision(i:number, val:'write'|'skip'){ setPlanRows(prev=> prev.map((r,idx)=> idx===i?{...r, decision:val}:r)); }
  async function applyPlan(){
    if (!selected) { setLog('Pick a builder first.'); return; }
    const plan = planRows.map(r=> ({ to: r.to, action: r.decision }));
    setLog('Applying plan…');
    const j = await apiBuilds('apply_plan', { id:selected, engine:'eta', variables: variablesFor(selected), plan });
    setLog(JSON.stringify(j,null,2));
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

        {/* Conflicts & Dry-Run */}
        <div className="border rounded p-4 2xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Conflicts & Dry-Run</h2>
            <div className="flex gap-2">
              <button className="px-3 py-2 border rounded" onClick={previewConflicts} disabled={!selected}>Preview Conflicts</button>
              <button className="px-3 py-2 border rounded" onClick={applyPlan} disabled={!planRows.length}>Apply Plan</button>
            </div>
          </div>

          {!planRows.length && <div className="text-sm text-gray-600 mt-2">Select a builder, set variables, then click <b>Preview Conflicts</b>.</div>}

          {!!planRows.length && (
            <div className="mt-3 space-y-3">
              <table className="w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2 border">File</th>
                    <th className="text-left p-2 border">Status</th>
                    <th className="text-left p-2 border">Decision</th>
                    <th className="text-left p-2 border">Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {planRows.map((r, i) => (
                    <tr key={r.to} className="align-top">
                      <td className="p-2 border font-mono text-xs">{r.to}</td>
                      <td className="p-2 border">
                        <span className={r.status==='modify'?'text-amber-600':r.status==='new'?'text-green-600':'text-gray-500'}>{r.status}</span>
                      </td>
                      <td className="p-2 border">
                        <select className="border rounded px-2 py-1" value={r.decision} onChange={(e)=>setDecision(i, e.target.value as any)}>
                          <option value="write">write</option>
                          <option value="skip">skip</option>
                        </select>
                      </td>
                      <td className="p-2 border">
                        {r.diff ? (
                          <details>
                            <summary className="cursor-pointer">view diff</summary>
                            <pre className="bg-black text-green-200 p-2 rounded whitespace-pre-wrap text-[11px] overflow-auto max-h-64">{r.diff}</pre>
                          </details>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className="font-medium mt-6">Output</h3>
          <pre className="text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[200px]">{log || 'Ready.'}</pre>
        </div>
      </div>

      {/* Link + Local Deploy (kept) */}
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
        <div className="border rounded p-4">
          <h2 className="font-medium mb-2">Link (GitHub ↔ Vercel)</h2>
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
          </div>
        </div>

        <div className="border rounded p-4 2xl:col-span-2">
          <h2 className="font-medium mb-2">Local Deploy (Compose)</h2>
          <div className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <button className="px-2 py-1 border rounded" onClick={()=>apiDeploy('config',{target:'local'}).then(j=>setLog(JSON.stringify(j,null,2)))}>Config</button>
              <button className="px-2 py-1 border rounded" onClick={()=>apiDeploy('build',{target:'local'}).then(j=>setLog(JSON.stringify(j,null,2)))}>Build</button>
              <button className="px-2 py-1 border rounded" onClick={()=>apiDeploy('up',{target:'local'}).then(j=>setLog(JSON.stringify(j,null,2)))}>Up</button>
              <button className="px-2 py-1 border rounded" onClick={()=>apiDeploy('down',{target:'local'}).then(j=>setLog(JSON.stringify(j,null,2)))}>Down</button>
              <button className="px-2 py-1 border rounded" onClick={()=>apiDeploy('ps',{target:'local'}).then(j=>setLog(JSON.stringify(j,null,2)))}>PS</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24">Logs service</label>
              <input className="border rounded px-2 py-1 w-full" placeholder="(optional) service name" value={deployService} onChange={e=>setDeployService(e.target.value)} />
              <label className="w-10">Tail</label>
              <input className="border rounded px-2 py-1 w-24" value={deployTail} onChange={e=>setDeployTail(e.target.value)} />
              <button className="px-3 py-2 border rounded" onClick={()=>apiDeploy('logs',{target:'local', service:deployService, tail:deployTail}).then(j=>setLog(JSON.stringify(j,null,2)))}>Logs</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
