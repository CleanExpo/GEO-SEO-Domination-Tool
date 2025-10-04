'use client';
import { useEffect, useState } from 'react';

async function api(body:any){
  const r = await fetch('/api/integrations', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  return r.json();
}

export default function IntegrationsPage(){
  const [github,setGitHub]=useState('');
  const [vercel,setVercel]=useState('');
  const [supabaseUrl,setSupabaseUrl]=useState('');
  const [supabaseAnon,setSupabaseAnon]=useState('');
  const [status,setStatus]=useState<any>(null);
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function load(){
    setBusy(true); setMsg('');
    try{ const r = await fetch('/api/integrations'); const j = await r.json(); setStatus(j); }catch{}
    finally{ setBusy(false); }
  }
  useEffect(()=>{ load(); },[]);

  async function save(){
    setBusy(true); setMsg('');
    try{
      const j = await api({ action:'save_tokens', github_token: github, vercel_token: vercel, supabase_url: supabaseUrl, supabase_anonKey: supabaseAnon });
      if(!j.ok) throw new Error(j.error||'failed'); setMsg('Saved.'); await check();
    }catch(e:any){ setMsg(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  async function check(){
    const j = await api({ action:'status' }); setStatus(j);
  }

  const chip = (b?:boolean)=> <span className={`px-2 py-0.5 rounded text-xs ${b?'bg-green-100 text-green-700':'bg-gray-100 text-gray-600'}`}>{b?'Present':'Missing'}</span>;

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Integrations</h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='border rounded p-4 space-y-3'>
          <div className='font-medium'>GitHub</div>
          <input className='border rounded px-2 py-1 w-full' placeholder='GITHUB_TOKEN' value={github} onChange={e=>setGitHub(e.target.value)} />
          <div className='text-xs'>Status: {chip(status?.status?.github?.ok)}</div>
        </div>
        <div className='border rounded p-4 space-y-3'>
          <div className='font-medium'>Vercel</div>
          <input className='border rounded px-2 py-1 w-full' placeholder='VERCEL_TOKEN' value={vercel} onChange={e=>setVercel(e.target.value)} />
          <div className='text-xs'>Status: {chip(status?.status?.vercel?.ok)}</div>
        </div>
        <div className='md:col-span-2 border rounded p-4 space-y-3'>
          <div className='font-medium'>Supabase</div>
          <input className='border rounded px-2 py-1 w-full' placeholder='SUPABASE_URL' value={supabaseUrl} onChange={e=>setSupabaseUrl(e.target.value)} />
          <input className='border rounded px-2 py-1 w-full' placeholder='SUPABASE_ANON_KEY' value={supabaseAnon} onChange={e=>setSupabaseAnon(e.target.value)} />
          <div className='text-xs'>Health: {chip(status?.status?.supabase?.ok)}</div>
        </div>
      </div>

      <div className='flex gap-2'>
        <button onClick={save} disabled={busy} className='px-3 py-2 border rounded'>{busy?'Saving…':'Save'}</button>
        <button onClick={check} disabled={busy} className='px-3 py-2 border rounded'>{busy?'Checking…':'Check Status'}</button>
      </div>

      {msg && <div className='text-sm'>{msg}</div>}

      <div className='text-xs text-gray-500'>Tokens are stored in <code>server/secrets/integrations.local.json</code> (gitignored). In production, prefer environment variables or a secret manager.</div>
    </div>
  );
}
