'use client';
import { useEffect, useState } from 'react';

type Res = { ok:boolean; result?:any; error?:string; status?:any; target?:'blue'|'green' };

async function post(action:string, target?:'blue'|'green'){
  const r = await fetch('/api/bluegreen', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, target }) });
  return r.json() as Promise<Res>;
}

export default function BlueGreen(){
  const [busy,setBusy]=useState(false);
  const [cur,setCur]=useState<'blue'|'green'|null>(null);
  const [ps,setPs]=useState('');
  const [log,setLog]=useState('');
  const [err,setErr]=useState('');

  async function refresh(){
    setBusy(true); setErr('');
    try{
      const j = await post('status');
      if (!j.ok) throw new Error(j.error||'status failed');
      setCur(j.result?.current??null);
      setPs(j.result?.ps||'');
    }catch(e:any){ setErr(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  useEffect(()=>{ refresh(); },[]);

  async function run(action:string, target:'blue'|'green'){
    setBusy(true); setErr(''); setLog('');
    try{
      const j = await post(action, target);
      if (!j.ok) throw new Error(j.error||`${action} failed`);
      if (j.result?.stdout) setLog(j.result.stdout);
      await refresh();
    }catch(e:any){ setErr(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  return (
    <div className='max-w-5xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Blue/Green Deploy</h1>
        <button className='px-3 py-2 border rounded disabled:opacity-60' onClick={refresh} disabled={busy}>{busy?'Refreshing…':'Refresh'}</button>
      </div>

      {err && <div className='text-sm text-red-600'>{err}</div>}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='border rounded p-4 space-y-3'>
          <div className='text-sm'>Current traffic: <b>{cur ?? 'unknown'}</b></div>
          <div className='grid grid-cols-2 gap-2'>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('build','blue')}>Build BLUE</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('build','green')}>Build GREEN</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('up','blue')}>Up BLUE</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('up','green')}>Up GREEN</button>
            <button className='px-3 py-2 border rounded' disabled={busy || cur==='blue'} onClick={()=>run('switch','blue')}>Switch → BLUE</button>
            <button className='px-3 py-2 border rounded' disabled={busy || cur==='green'} onClick={()=>run('switch','green')}>Switch → GREEN</button>
            <button className='px-3 py-2 border rounded' disabled={busy} onClick={()=>run('rollback', cur==='blue'?'blue':'green')}>Rollback</button>
          </div>
        </div>

        <div className='border rounded p-4'>
          <div className='font-mono text-xs whitespace-pre-wrap max-h-[280px] overflow-auto'>{ps || 'docker compose ps will appear here…'}</div>
        </div>
      </div>

      {!!log && (
        <div className='border rounded p-4'>
          <div className='font-semibold mb-2'>Last command output</div>
          <pre className='text-xs whitespace-pre-wrap max-h-[360px] overflow-auto'>{log}</pre>
        </div>
      )}

      <div className='text-xs text-gray-500'>Proxy runs on port 8080 (host). Point your browser to <code>http://localhost:8080</code> (or your server IP) to reach the active stack.</div>
    </div>
  );
}
