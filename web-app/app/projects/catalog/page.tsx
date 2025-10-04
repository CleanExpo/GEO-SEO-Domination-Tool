'use client';
import { useEffect, useState } from 'react';

async function jget(u:string){ const r = await fetch(u, { cache:'no-store' }); return r.json(); }
async function jpost(u:string, b:any){ const r = await fetch(u, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(b) }); return r.json(); }

export default function Catalog(){
  const [list, setList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState<string>('');
  const [autolink, setAutolink] = useState(true);
  const [deploy, setDeploy] = useState(true);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [vercel, setVercel] = useState('');
  const [out, setOut] = useState('Ready.');

  async function load(){ const j = await jget('/api/blueprints'); if (j?.ok) setList(j.result.blueprints||[]); }
  useEffect(()=>{ load(); }, []);

  async function run(){
    if (!sel) return;
    setBusy(true); setOut('Running blueprint…');
    try{
      const j = await jpost('/api/blueprints', { id: sel, autolink, deploy, githubOwner: owner, githubRepo: repo, vercelProject: vercel || repo });
      setOut(j?.ok ? (j.result?.logs||[]).join('\n') : `✖ ${j?.error||'failed'}`);
    }catch(e:any){ setOut(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  return (
    <div className='max-w-5xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Blueprint Catalog</h1>

      <div className='border rounded p-4 space-y-3'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <div>
            <label className='block text-xs text-gray-500 mb-1'>Blueprint</label>
            <select className='border rounded px-3 py-2 w-full' value={sel} onChange={e=> setSel(e.target.value)}>
              <option value=''>Select…</option>
              {list.map((b:any)=> (<option key={b.id} value={b.id}>{b.title||b.id}</option>))}
            </select>
          </div>
          <label className='flex items-end gap-2'>
            <input type='checkbox' checked={autolink} onChange={e=> setAutolink(e.target.checked)} />
            <span className='text-sm'>Auto-Link (GitHub↔Vercel)</span>
          </label>
          <label className='flex items-end gap-2'>
            <input type='checkbox' checked={deploy} onChange={e=> setDeploy(e.target.checked)} />
            <span className='text-sm'>First Deploy (docker compose up -d)</span>
          </label>
        </div>

        {autolink && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>GitHub Owner</label>
              <input className='border rounded px-3 py-2 w-full' value={owner} onChange={e=> setOwner(e.target.value)} placeholder='your-org-or-user' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Repository</label>
              <input className='border rounded px-3 py-2 w-full' value={repo} onChange={e=> setRepo(e.target.value)} placeholder='my-saas-starter' />
            </div>
            <div>
              <label className='block text-xs text-gray-500 mb-1'>Vercel Project</label>
              <input className='border rounded px-3 py-2 w-full' value={vercel} onChange={e=> setVercel(e.target.value)} placeholder='(defaults to repo)' />
            </div>
          </div>
        )}

        <button className='px-3 py-2 border rounded disabled:opacity-60' disabled={!sel || (autolink && (!owner||!repo)) || busy} onClick={run}>{busy? 'Running…' : 'Run Blueprint'}</button>
      </div>

      <div className='border rounded p-4'>
        <h2 className='font-medium mb-2'>Output</h2>
        <pre className='bg-black text-green-400 text-xs p-3 rounded min-h-[160px] whitespace-pre-wrap'>{out}</pre>
      </div>

      <div className='text-xs text-gray-500'>Tip: Blueprints are read from <code>/blueprints/*.json</code>.</div>
    </div>
  );
}
