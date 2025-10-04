'use client';
import { useEffect, useState } from 'react';

function useApi(){
  const [data,set]=useState<any>(null); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false);
  const run=async()=>{ setBusy(true); setErr(''); try{ const r=await fetch('/api/analytics',{cache:'no-store'}); const j=await r.json(); if(!j?.ok) throw new Error(j?.error||'failed'); set(j); }catch(e:any){ setErr(e?.message||'failed'); } finally{ setBusy(false); } };
  return { data, err, busy, run };
}

export default function Analytics(){
  const api = useApi();
  useEffect(()=>{ api.run(); },[]);
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Post-Release Analytics</h1>
        <button className='px-3 py-2 border rounded disabled:opacity-60' disabled={api.busy} onClick={api.run}>{api.busy?'Refreshing…':'Refresh'}</button>
      </div>
      {api.err && <div className='text-sm text-red-600'>{api.err}</div>}

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
        <div className='border rounded p-4'>
          <div className='font-medium mb-2'>Totals</div>
          <div className='text-sm space-y-1'>
            <div>Views: <b>{api.data?.totals?.views ?? '—'}</b></div>
            <div>Events: <b>{api.data?.totals?.events ?? '—'}</b></div>
          </div>
        </div>
        <div className='lg:col-span-2 border rounded p-4'>
          <div className='font-medium mb-2'>Top Pages (7 days)</div>
          <div className='text-sm space-y-1'>
            {(api.data?.summary||[]).map((r:any)=> (
              <div key={r.path} className='flex items-center justify-between border-b py-1'>
                <span className='truncate'>{r.path}</span>
                <span className='font-mono'>{r.count}</span>
              </div>
            ))}
            {(!api.data?.summary?.length) && <div className='text-xs text-gray-500'>No data yet. Browse the app to generate views.</div>}
          </div>
        </div>
      </div>

      <div className='border rounded p-4'>
        <div className='font-medium mb-2'>Deploy Switches</div>
        <pre className='text-xs whitespace-pre-wrap max-h-[300px] overflow-auto'>{JSON.stringify(api.data?.switches||[], null, 2)}</pre>
      </div>
    </div>
  );
}
