'use client';
import { useEffect, useState } from 'react';

function useUptime(){
  const [avail,setAvail]=useState<number|null>(null);
  const [uptimeErr,setUptimeErr]=useState('');
  const runUptime=async()=>{
    try{
      const r=await fetch('/api/uptime',{cache:'no-store'});
      const j=await r.json();
      if(!j?.ok) throw new Error(j?.error||'failed');
      setAvail(j.availability24h);
    }catch(e:any){
      setUptimeErr(e?.message||'');
    }
  };
  return {avail,uptimeErr,runUptime};
}

export default function Health(){
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const uptime = useUptime();

  async function load(){
    setBusy(true); setErr('');
    try{
      const r = await fetch('/api/health', { cache: 'no-store' });
      const j = await r.json();
      if (!j) throw new Error('no response');
      setData(j);
    }catch(e:any){ setErr(e?.message||'failed'); }
    finally{ setBusy(false); }
  }
  useEffect(()=>{ load(); uptime.runUptime(); }, []);

  const badge = uptime.avail==null? '—' : `${uptime.avail.toFixed(2)}%`;
  const color = uptime.avail==null? 'bg-gray-300' : (uptime.avail>=99.9? 'bg-green-500' : uptime.avail>=98? 'bg-yellow-500' : 'bg-red-500');

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>System Health</h1>
        <button className='px-3 py-2 border rounded disabled:opacity-60' onClick={load} disabled={busy}>{busy?'Checking…':'Refresh'}</button>
      </div>

      <div className='border rounded p-4 bg-gray-50'>
        <div className='flex items-center gap-2 text-sm'>
          <span className={`w-2 h-2 rounded-full ${color}`}></span>
          <span className='font-medium'>Uptime (24h): {badge}</span>
        </div>
        {uptime.uptimeErr && <div className='text-xs text-red-600 mt-1'>{uptime.uptimeErr}</div>}
      </div>

      {err && <div className='text-sm text-red-600'>{err}</div>}

      {data && (
        <div className={`border rounded p-4 ${data.ok? 'border-green-300' : 'border-red-300'}`}>
          <div className='mb-3'>Overall: <b className={data.ok? 'text-green-600' : 'text-red-600'}>{data.ok?'PASS':'FAIL'}</b></div>
          <div className='space-y-2'>
            {data.results?.map((r:any, i:number)=> (
              <div key={i} className='border rounded p-3'>
                <div className='flex items-center justify-between'>
                  <div className='font-mono text-sm'>{r.name}</div>
                  <div className={`text-xs px-2 py-0.5 rounded border ${r.status==='pass'?'border-green-300':'border-red-300'}`}>{r.status}</div>
                </div>
                {r.detail && (
                  <pre className='text-xs whitespace-pre-wrap mt-2'>{typeof r.detail==='string' ? r.detail : JSON.stringify(r.detail,null,2)}</pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='text-xs text-gray-500'>Checks: Node, Docker, MCP dist, MCP builders, Supabase public envs, local secrets presence.</div>
    </div>
  );
}
