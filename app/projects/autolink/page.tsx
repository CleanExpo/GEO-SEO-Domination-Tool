'use client';
import { useState } from 'react';

async function jpost<T=any>(u:string, b:any){ const r = await fetch(u, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(b) }); return r.json() as Promise<T>; }

export default function AutoLinkPage(){
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [vercel, setVercel] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<string>('Ready.');

  async function run(){
    setBusy(true); setOut('Running&');
    try{
      const j = await jpost('/api/autolink', { owner, repo, private: isPrivate, vercelProject: vercel || repo });
      if (!j?.ok) { setOut(` ${j?.error||'failed'}`); return; }
      setOut((j.result?.logs||[]).join('\n') || 'Done.');
    }catch(e:any){ setOut(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>One-Click Auto-Link</h1>
      <p className='text-sm text-gray-600'>Creates a GitHub repo and links a Vercel project using tokens saved in <code>/settings/integrations</code>.</p>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>GitHub Owner</label>
          <input className='border rounded px-3 py-2 w-full' value={owner} onChange={e=>setOwner(e.target.value)} placeholder='your-org-or-user' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Repository Name</label>
          <input className='border rounded px-3 py-2 w-full' value={repo} onChange={e=>setRepo(e.target.value)} placeholder='my-saas-starter' />
        </div>
        <div>
          <label className='block text-xs text-gray-500 mb-1'>Vercel Project</label>
          <input className='border rounded px-3 py-2 w-full' value={vercel} onChange={e=>setVercel(e.target.value)} placeholder='(defaults to repo name)' />
        </div>
        <div className='flex items-end'>
          <label className='flex items-center gap-2 text-sm'>
            <input type='checkbox' checked={isPrivate} onChange={e=>setIsPrivate(e.target.checked)} /> Private repo
          </label>
        </div>
      </div>

      <button className='px-3 py-2 border rounded disabled:opacity-60' disabled={busy || !owner || !repo} onClick={run}>{busy? 'Linking&' : 'Create Repo + Link Vercel'}</button>

      <div>
        <h3 className='font-medium mt-4 mb-2'>Output</h3>
        <pre className='bg-black text-green-400 text-xs p-3 rounded min-h-[140px] whitespace-pre-wrap'>{out}</pre>
      </div>
    </div>
  );
}
