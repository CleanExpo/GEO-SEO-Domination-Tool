'use client';
import { useEffect, useMemo, useState } from 'react';

async function apiBlueprints(action: string, params: any = {}) {
  const r = await fetch('/api/blueprints', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) });
  return r.json();
}

export default function BlueprintsPage(){
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [log, setLog] = useState('');

  // Optional overrides for common variables
  const [routeName, setRouteName] = useState('health');
  const [schemaName, setSchemaName] = useState('events');

  useEffect(()=>{ (async()=>{ const j = await fetch('/api/blueprints').then(r=>r.json()); setList(j?.result?.blueprints||[]); })(); },[]);

  async function preview(){
    if(!selected){ setLog('Pick a blueprint.'); return; }
    setLog('Previewing…');
    const j = await apiBlueprints('preview', { id: selected });
    const files = j?.result?.files||[];
    setRows(files.map((f:any)=> ({...f, decision: f.status==='identical'?'skip':'write'})));
    setLog(JSON.stringify(j,null,2));
  }
  function setDecision(i:number, v:'write'|'skip'){ setRows(prev=> prev.map((r,idx)=> idx===i?{...r, decision:v}:r)); }
  async function apply(){
    if(!selected){ setLog('Pick a blueprint.'); return; }
    const selections = rows.map(r=> ({ to:r.to, action:r.decision }));
    setLog('Applying…');
    const j = await apiBlueprints('apply', { id:selected, selections });
    setLog(JSON.stringify(j,null,2));
  }

  const hasRows = useMemo(()=> rows.length>0,[rows]);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Projects → Blueprints</h1>
        <div className='flex gap-2'>
          <button className='px-3 py-2 border rounded' onClick={preview} disabled={!selected}>Preview</button>
          <button className='px-3 py-2 border rounded' onClick={apply} disabled={!hasRows}>Apply</button>
        </div>
      </div>

      <div className='grid grid-cols-1 2xl:grid-cols-3 gap-6'>
        <div className='border rounded p-4'>
          <h2 className='font-medium mb-2'>Blueprints</h2>
          <select className='border rounded w-full px-2 py-2' value={selected} onChange={e=>setSelected(e.target.value)}>
            <option value=''>Select a blueprint…</option>
            {list.map((b:any)=> <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          {!!selected && (
            <div className='text-sm text-gray-600 mt-2'>
              {list.find(b=>b.id===selected)?.summary || ''}
            </div>
          )}

          <div className='mt-4 space-y-2 text-sm'>
            <div className='font-medium'>Optional overrides</div>
            <div className='flex items-center gap-2'>
              <label className='w-28'>ROUTE_NAME</label>
              <input className='border rounded px-2 py-1 w-full' value={routeName} onChange={e=>setRouteName(e.target.value)} />
            </div>
            <div className='flex items-center gap-2'>
              <label className='w-28'>SCHEMA_NAME</label>
              <input className='border rounded px-2 py-1 w-full' value={schemaName} onChange={e=>setSchemaName(e.target.value)} />
            </div>
            <div className='text-xs text-gray-500'>
              (Future: inline variable editing per step.)
            </div>
          </div>
        </div>

        <div className='border rounded p-4 2xl:col-span-2'>
          <h2 className='font-medium mb-2'>Plan Preview</h2>
          {!hasRows && <div className='text-sm text-gray-600'>Choose a blueprint and click <b>Preview</b>.</div>}
          {!!hasRows && (
            <div className='space-y-3'>
              <table className='w-full text-sm border'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left p-2 border'>File</th>
                    <th className='text-left p-2 border'>Builder</th>
                    <th className='text-left p-2 border'>Status</th>
                    <th className='text-left p-2 border'>Decision</th>
                    <th className='text-left p-2 border'>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r:any, i:number)=> (
                    <tr key={r.to+String(i)} className='align-top'>
                      <td className='p-2 border font-mono text-xs'>{r.to}</td>
                      <td className='p-2 border text-xs'>{r.builder}</td>
                      <td className='p-2 border'><span className={r.status==='modify'?'text-amber-600':r.status==='new'?'text-green-600':'text-gray-500'}>{r.status}</span></td>
                      <td className='p-2 border'>
                        <select className='border rounded px-2 py-1' value={r.decision} onChange={e=>setDecision(i, e.target.value as any)}>
                          <option value='write'>write</option>
                          <option value='skip'>skip</option>
                        </select>
                      </td>
                      <td className='p-2 border'>
                        {r.diff? (
                          <details>
                            <summary className='cursor-pointer'>view diff</summary>
                            <pre className='bg-black text-green-200 p-2 rounded whitespace-pre-wrap text-[11px] overflow-auto max-h-64'>{r.diff}</pre>
                          </details>
                        ): <span className='text-gray-400'>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h3 className='font-medium mt-6'>Output</h3>
          <pre className='text-xs whitespace-pre-wrap bg-black text-green-200 p-3 rounded min-h-[200px]'>{log || 'Ready.'}</pre>
        </div>
      </div>
    </div>
  );
}
