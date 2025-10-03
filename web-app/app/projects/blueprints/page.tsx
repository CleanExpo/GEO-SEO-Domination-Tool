'use client';
import { useEffect, useMemo, useState } from 'react';

type StepShape = { index:number; builder:string; variables: { name:string; required:boolean; example:string }[] };

async function apiBlueprints(action: string, params: any = {}) {
  const r = await fetch('/api/blueprints', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action, params }) });
  return r.json();
}

export default function BlueprintsPage(){
  const [list, setList] = useState<any[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [rows, setRows] = useState<any[]>([]);
  const [shape, setShape] = useState<StepShape[]>([]);
  const [overrides, setOverrides] = useState<Record<number, Record<string,string>>>({});
  const [log, setLog] = useState('');

  useEffect(()=>{ (async()=>{ const j = await fetch('/api/blueprints').then(r=>r.json()); setList(j?.result?.blueprints||[]); })(); },[]);

  async function loadShape(id:string){
    const info = await apiBlueprints('introspect', { id });
    setShape(info?.result?.steps||[]);
    // seed overrides with examples for convenience
    const seed: Record<number, Record<string,string>> = {};
    (info?.result?.steps||[]).forEach((s:StepShape)=>{
      seed[s.index] = {};
      s.variables.forEach(v=>{ if (v.example) seed[s.index][v.name] = String(v.example); });
    });
    setOverrides(seed);
  }

  async function onPick(id:string){
    setSelected(id);
    setRows([]);
    setLog('');
    await loadShape(id);
  }

  function setOverride(idx:number, name:string, val:string){
    setOverrides(prev=> ({ ...prev, [idx]: { ...(prev[idx]||{}), [name]: val } }));
  }

  async function preview(){
    if(!selected){ setLog('Pick a blueprint.'); return; }
    setLog('Previewing…');
    const ovArr = Object.keys(overrides).map(k=> ({ index: Number(k), variables: overrides[Number(k)] }));
    const j = await apiBlueprints('preview', { id: selected, overrides: ovArr });
    const files = j?.result?.files||[];
    setRows(files.map((f:any)=> ({...f, decision: f.status==='identical'?'skip':'write'})));
    setLog(JSON.stringify(j,null,2));
  }

  function setDecision(i:number, v:'write'|'skip'){ setRows(prev=> prev.map((r,idx)=> idx===i?{...r, decision:v}:r)); }

  async function apply(){
    if(!selected){ setLog('Pick a blueprint.'); return; }
    const selections = rows.map(r=> ({ to:r.to, action:r.decision }));
    const ovArr = Object.keys(overrides).map(k=> ({ index: Number(k), variables: overrides[Number(k)] }));
    setLog('Applying…');
    const j = await apiBlueprints('apply', { id:selected, selections, overrides: ovArr });
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
        {/* Picker + Variables */}
        <div className='border rounded p-4'>
          <h2 className='font-medium mb-2'>Blueprints</h2>
          <select className='border rounded w-full px-2 py-2' value={selected} onChange={e=>onPick(e.target.value)}>
            <option value=''>Select a blueprint…</option>
            {list.map((b:any)=> <option key={b.id} value={b.id}>{b.title}</option>)}
          </select>
          {!!selected && (
            <div className='mt-4'>
              <h3 className='font-medium mb-2'>Variables per Step</h3>
              {(!shape.length) && <div className='text-sm text-gray-500'>Loading step variables…</div>}
              <div className='space-y-3'>
                {shape.map((s)=> (
                  <div key={s.index} className='border rounded p-3'>
                    <div className='text-sm font-semibold mb-1'>Step {s.index+1}: <span className='font-mono'>{s.builder}</span></div>
                    {!s.variables.length && <div className='text-xs text-gray-500'>No variables</div>}
                    {s.variables.map((v)=> (
                      <div key={v.name} className='flex items-center gap-2 text-sm mt-1'>
                        <label className='w-40'>{v.name}{v.required? ' *':''}</label>
                        <input className='border rounded px-2 py-1 w-full' value={(overrides[s.index]?.[v.name] ?? '')} onChange={e=>setOverride(s.index, v.name, e.target.value)} placeholder={v.example || ''} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Plan Preview */}
        <div className='border rounded p-4 2xl:col-span-2'>
          <h2 className='font-medium mb-2'>Plan Preview</h2>
          {!hasRows && <div className='text-sm text-gray-600'>Set variables (if any), then click <b>Preview</b>.</div>}
          {!!hasRows && (
            <div className='space-y-3'>
              <table className='w-full text-sm border'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='text-left p-2 border'>File</th>
                    <th className='text-left p-2 border'>Step</th>
                    <th className='text-left p-2 border'>Status</th>
                    <th className='text-left p-2 border'>Decision</th>
                    <th className='text-left p-2 border'>Diff</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r:any, i:number)=> (
                    <tr key={r.to+String(i)} className='align-top'>
                      <td className='p-2 border font-mono text-xs'>{r.to}</td>
                      <td className='p-2 border text-xs'>#{(r.index??0)+1} <span className='font-mono'>{r.builder}</span></td>
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
