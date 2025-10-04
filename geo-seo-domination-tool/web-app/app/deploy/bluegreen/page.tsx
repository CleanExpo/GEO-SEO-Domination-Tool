'use client';
import { useEffect, useState } from 'react';

type Res = { ok:boolean; result?:any; error?:string; status?:any; target?:'blue'|'green'; prod?:boolean };

async function post(body:any){
  const r = await fetch('/api/bluegreen', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) });
  return r.json() as Promise<Res>;
}

export default function BlueGreen(){
  const [busy,setBusy]=useState(false);
  const [cur,setCur]=useState<'blue'|'green'|null>(null);
  const [psDev,setPsDev]=useState('');
  const [psProd,setPsProd]=useState('');
  const [log,setLog]=useState('');
  const [err,setErr]=useState('');

  async function refresh(){
    setBusy(true); setErr('');
    try{
      const [dev,prod] = await Promise.all([
        post({ action:'status', prod:false }),
        post({ action:'status', prod:true })
      ]);
      if (dev.ok) { setCur(dev.result?.current??null); setPsDev(dev.result?.ps||''); }
      if (prod.ok) { setPsProd(prod.result?.ps||''); }
    }catch(e:any){ setErr(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  useEffect(()=>{ refresh(); },[]);

  async function run(action:string, target:'blue'|'green', prod:boolean){
    setBusy(true); setErr(''); setLog('');
    try{
      const j = await post({ action, target, prod });
      if (!j.ok) throw new Error(j.error||`${action} failed`);
      if (j.result?.stdout) setLog(j.result.stdout);
      await refresh();
    }catch(e:any){ setErr(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  // Analytics annotation on switch
  async function runWithAnnotation(action:string, target:'blue'|'green', prod:boolean){
    await run(action, target, prod);
    if (action === 'switch') {
      try { await fetch('/api/analytics', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type:'event', name:'deploy.switch', payload:{ target, prod } }) }); } catch {}
    }
  }

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Blue/Green Deploy</h1>
        <button className='px-3 py-2 border rounded disabled:opacity-60' onClick={refresh} disabled={busy}>{busy?'Refreshing…':'Refresh'}</button>
      </div>

      {err && <div className='text-sm text-red-600'>{err}</div>}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <div className='border rounded p-4 space-y-3'>
          <div className='text-sm'>Current traffic: <b>{cur ?? 'unknown'}</b> (dev compose)</div>
          <div className='grid grid-cols-2 gap-2'>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('build','blue',false)}>Build BLUE (dev)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('build','green',false)}>Build GREEN (dev)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('up','blue',false)}>Up BLUE (dev)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('up','green',false)}>Up GREEN (dev)</button>
            <button className='px-3 py-2 border rounded' disabled={busy || cur==='blue'} onClick={()=>runWithAnnotation('switch','blue',false)}>Switch → BLUE (dev)</button>
            <button className='px-3 py-2 border rounded' disabled={busy || cur==='green'} onClick={()=>runWithAnnotation('switch','green',false)}>Switch → GREEN (dev)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('rollback', cur==='blue'?'blue':'green',false)}>Rollback (dev)</button>
          </div>
        </div>

        <div className='border rounded p-4 space-y-3'>
          <div className='text-sm'>Production controls (image tags)</div>
          <div className='grid grid-cols-2 gap-2'>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('pull','blue',true)}>Pull BLUE (prod)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('pull','green',true)}>Pull GREEN (prod)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('up','blue',true)}>Up BLUE (prod)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('up','green',true)}>Up GREEN (prod)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>runWithAnnotation('switch','blue',true)}>Switch → BLUE (prod)</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>runWithAnnotation('switch','green',true)}>Switch → GREEN (prod)</button>
          </div>
        </div>
      </div>

      {!!log && (
        <div className='border rounded p-4'>
          <div className='font-semibold mb-2'>Last command output</div>
          <pre className='text-xs whitespace-pre-wrap max-h-[360px] overflow-auto'>{log}</pre>
        </div>
      )}

      <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
        <div className='border rounded p-4'>
          <div className='font-semibold mb-2'>docker compose ps (dev)</div>
          <pre className='text-xs whitespace-pre-wrap max-h-[220px] overflow-auto'>{psDev||'—'}</pre>
        </div>
        <div className='border rounded p-4'>
          <div className='font-semibold mb-2'>docker compose ps (prod)</div>
          <pre className='text-xs whitespace-pre-wrap max-h-[220px] overflow-auto'>{psProd||'—'}</pre>
        </div>
      </div>

      <div className='text-xs text-gray-500'>Prod compose uses <code>ghcr.io/YOUR_ORG/YOUR_REPO/web:latest</code>. Update org/repo, or retag via workflow_dispatch.</div>

      <ReleaseTagStamp />
    </div>
  );
}

function ReleaseTagStamp(){
  const [tag,set]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');
  useEffect(()=>{ fetch('/api/release/tag', { cache: 'no-store' }).then(r=>r.json()).then(j=> j?.tag && set(j.tag)).catch(()=>{}); },[]);
  async function save(){ setBusy(true); setMsg(''); try{ const r = await fetch('/api/release/tag', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tag }) }); const j = await r.json(); if(!j.ok) throw new Error(j.error||'failed'); setMsg('Saved. Recreate target to pick up tag.'); }catch(e:any){ setMsg(e?.message||'failed'); } finally{ setBusy(false); } }
  return (
    <div className='border rounded p-4 space-y-3 mt-4'>
      <div className='font-medium'>Release Tag</div>
      <div className='flex gap-2'>
        <input className='border rounded px-2 py-1 w-full' value={tag} onChange={e=>set(e.target.value)} placeholder='v1.0.0' />
        <button onClick={save} disabled={busy} className='px-3 py-1 border rounded'>{busy?'Saving…':'Save'}</button>
      </div>
      <div className='text-xs text-gray-500'>Writes <code>server/release.env</code> with <code>NEXT_PUBLIC_RELEASE_TAG</code>. Blue/Green containers read this via compose <code>env_file</code>. Use <b>Up</b> for the target color to recreate with the new tag.</div>
      {!!msg && <div className='text-xs'>{msg}</div>}
    </div>
  );
}
