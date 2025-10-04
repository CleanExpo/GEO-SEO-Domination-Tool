'use client';
import { useEffect, useState } from 'react';

async function jget<T=any>(u:string){ const r = await fetch(u, { cache:'no-store' }); return r.json() as Promise<T>; }
async function jpost<T=any>(u:string, b:any){ const r = await fetch(u, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(b) }); return r.json() as Promise<T>; }

export default function JobsPage(){
  const [jobs, setJobs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ type:'build', action:'apply_builder', id:'nextjs-api-route', variables:'{"ROUTE_NAME":"health"}', deployVerb:'up' });

  async function load(){ const j = await jget('/api/jobs'); if (j?.ok) setJobs(j.result.jobs); }
  useEffect(()=>{ load(); const t = setInterval(load, 1500); return ()=> clearInterval(t); }, []);

  async function enqueue(){
    setBusy(true);
    try{
      if (form.type === 'build'){
        const payload = { action: form.action, id: form.id, variables: JSON.parse(form.variables||'{}') };
        await jpost('/api/jobs', { type:'build', payload });
      } else if (form.type === 'deploy'){
        const payload = { verb: form.deployVerb, composePath: undefined, extraArgs: [] };
        await jpost('/api/jobs', { type:'deploy', payload });
      } else {
        await jpost('/api/jobs', { type:'api_call', payload: { note:'ping' } });
      }
      await load();
    }catch(e){ /* ignore */ }
    finally{ setBusy(false); }
  }

  async function cancel(id:string){ await jpost(`/api/jobs/${id}`, { action:'cancel' }); load(); }

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Jobs</h1>
        <button className='px-3 py-2 border rounded' onClick={load}>Refresh</button>
      </div>

      <div className='border rounded p-4'>
        <h2 className='font-medium mb-2'>Create Job</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-sm'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Type</label>
            <select className='border rounded px-2 py-1 w-full' value={form.type} onChange={e=> setForm({ ...form, type: e.target.value as any })}>
              <option value='build'>build (MCP)</option>
              <option value='deploy'>deploy (docker compose)</option>
              <option value='api_call'>api_call</option>
            </select>
          </div>

          {form.type==='build' && (
            <>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>MCP Action</label>
                <select className='border rounded px-2 py-1 w-full' value={form.action} onChange={e=> setForm({ ...form, action: e.target.value })}>
                  <option value='preview_apply'>preview_apply</option>
                  <option value='apply_builder'>apply_builder</option>
                  <option value='list_builders'>list_builders</option>
                  <option value='inspect_builder'>inspect_builder</option>
                </select>
              </div>
              <div>
                <label className='block text-xs text-gray-500 mb-1'>Builder Id</label>
                <input className='border rounded px-2 py-1 w-full' value={form.id} onChange={e=> setForm({ ...form, id: e.target.value })} placeholder='nextjs-api-route' />
              </div>
              <div className='md:col-span-3'>
                <label className='block text-xs text-gray-500 mb-1'>Variables JSON</label>
                <textarea className='border rounded px-2 py-1 w-full font-mono text-xs min-h-[90px]' value={form.variables} onChange={e=> setForm({ ...form, variables: e.target.value })} />
              </div>
            </>
          )}

          {form.type==='deploy' && (
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Verb</label>
              <select className='border rounded px-2 py-1 w-full' value={form.deployVerb} onChange={e=> setForm({ ...form, deployVerb: e.target.value })}>
                <option value='build'>build</option>
                <option value='up'>up -d</option>
                <option value='down'>down</option>
                <option value='ps'>ps</option>
                <option value='logs'>logs</option>
              </select>
            </div>
          )}
        </div>
        <div className='mt-3'>
          <button className='px-3 py-2 border rounded disabled:opacity-60' disabled={busy} onClick={enqueue}>{busy? 'Enqueuing…' : 'Enqueue Job'}</button>
        </div>
      </div>

      <div className='border rounded p-4'>
        <h2 className='font-medium mb-2'>Queue</h2>
        <div className='space-y-2'>
          {jobs.map(j=> (
            <div key={j.id} className='border rounded p-2'>
              <div className='flex items-center justify-between text-sm'>
                <div className='font-mono'>#{j.id}</div>
                <div className='uppercase'>{j.type}</div>
                <div className='capitalize'>{j.status}</div>
              </div>
              <div className='text-xs text-gray-600'>{j.step||'—'}</div>
              <div className='h-2 bg-gray-200 rounded mt-1'>
                <div className='h-2 bg-green-500 rounded' style={{ width: `${j.pct||0}%` }} />
              </div>
              <pre className='bg-black text-green-400 text-xs p-2 mt-2 whitespace-pre-wrap max-h-48 overflow-auto'>{(j.logs||[]).join('\n')||'—'}</pre>
              {(j.status==='queued'||j.status==='running') && (
                <div className='mt-2'>
                  <button className='px-2 py-1 border rounded text-xs' onClick={()=> cancel(j.id)}>Cancel</button>
                </div>
              )}
            </div>
          ))}
          {!jobs.length && <div className='text-sm text-gray-500'>No jobs yet.</div>}
        </div>
      </div>
    </div>
  );
}
