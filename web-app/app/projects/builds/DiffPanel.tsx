'use client';
import { useState } from 'react';

export function DiffPanel(){
  const [builderId, setBuilderId] = useState('');
  const [varsText, setVarsText] = useState('{}');
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [err, setErr] = useState('');

  async function preview(){
    setBusy(true); setErr(''); setFiles([]);
    try{
      let vars: any = {};
      try { vars = JSON.parse(varsText || '{}'); } catch { throw new Error('Variables JSON invalid'); }
      const r = await fetch('/api/diff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: builderId, variables: vars }) });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || 'preview failed');
      setFiles(j.result.files || []);
    }catch(e:any){ setErr(e?.message || 'Error'); }
    finally{ setBusy(false); }
  }

  return (
    <div className='border rounded-xl p-4 space-y-3'>
      <div className='flex items-center justify-between'>
        <h2 className='font-medium'>Diff Preview</h2>
        <span className='text-xs text-gray-500'>see file changes before apply</span>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
        <input className='border rounded px-3 py-2' placeholder='builder id (e.g., nextjs-api-route)' value={builderId} onChange={e=>setBuilderId(e.target.value)} />
        <textarea className='border rounded px-3 py-2 font-mono text-xs md:col-span-2 min-h-[44px]' value={varsText} onChange={e=>setVarsText(e.target.value)} placeholder='{"ROUTE_NAME":"health"}' />
      </div>
      <div className='flex gap-2'>
        <button className='px-3 py-2 border rounded disabled:opacity-60' disabled={!builderId || busy} onClick={preview}>{busy? 'Previewing…':'Preview Diff'}</button>
        {err && <span className='text-sm text-red-600'>{err}</span>}
      </div>
      {!!files.length && (
        <div className='space-y-3'>
          {files.map((f, i)=> (
            <div key={i} className='border rounded overflow-hidden'>
              <div className='px-3 py-2 text-sm bg-gray-50 flex items-center justify-between'>
                <div className='truncate'><b>{f.status.toUpperCase()}</b> — {f.to}</div>
                <div className='text-xs text-gray-500'>before: {f.bytes.before} • after: {f.bytes.after}</div>
              </div>
              <pre className='bg-black text-green-400 text-xs p-3 overflow-auto whitespace-pre-wrap'>{f.diff || 'No changes'}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
