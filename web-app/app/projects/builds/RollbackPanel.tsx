'use client';
import { useEffect, useState } from 'react';

export function RollbackPanel(){
  const [list, setList] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load(){
    const r = await fetch('/api/rollback', { cache:'no-store' });
    const j = await r.json();
    if (j?.ok) setList(j.result.backups||[]);
  }
  useEffect(()=>{ load(); }, []);

  async function restore(target:string){
    setBusy(true); setMsg('');
    try{
      const r = await fetch('/api/rollback', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ target }) });
      const j = await r.json();
      setMsg(j?.ok ? `Restored ${target}` : (j?.error||'restore failed'));
      load();
    }catch(e:any){ setMsg(e?.message||'restore failed'); }
    finally{ setBusy(false); }
  }

  return (
    <div className='border rounded-xl p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='font-medium'>Rollback from Backups</h2>
        <button className='px-2 py-1 border rounded text-xs' onClick={load}>Refresh</button>
      </div>
      <p className='text-xs text-gray-600'>These come from .bak files created during Selective Apply.</p>
      <div className='space-y-2 max-h-[360px] overflow-auto'>
        {list.map((b:any)=> (
          <div key={b.bak} className='border rounded p-2 text-sm flex items-center justify-between'>
            <div className='truncate'>
              <div className='font-mono truncate'>{b.target}</div>
              <div className='text-xs text-gray-500'>.bak: {b.bak} • {b.bytesBak} bytes • target: {b.bytesTarget ?? '—'} bytes</div>
            </div>
            <button className='px-2 py-1 border rounded text-xs disabled:opacity-60' disabled={busy} onClick={()=> restore(b.target)}>Restore</button>
          </div>
        ))}
        {!list.length && <div className='text-sm text-gray-500'>No backups yet.</div>}
      </div>
      {msg && <div className='text-sm'>{msg}</div>}
    </div>
  );
}
