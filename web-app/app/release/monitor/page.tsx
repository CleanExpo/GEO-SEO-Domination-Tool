'use client';
import { useEffect, useState } from 'react';

type PR = { number:number; title:string; head:string; base:string; draft:boolean; mergeable_state?:string|null; labels:string[]; html_url:string; statuses:any; checks:any };

export default function ReleaseMonitor(){
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [base, setBase] = useState('main');
  const [rel, setRel] = useState('release/geo-mcp-v1');
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function load(){
    if (!owner || !repo) return;
    setBusy(true); setErr('');
    try{
      const qs = new URLSearchParams({ owner, repo, base, release: rel });
      const r = await fetch(`/api/release/monitor?${qs}`, { cache:'no-store' });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error||'failed');
      setData(j.result);
    }catch(e:any){ setErr(e?.message||'failed'); }
    finally{ setBusy(false); }
  }

  useEffect(()=>{ /* lazy */ }, []);

  function Section({title, prs}:{title:string; prs:PR[]}){
    return (
      <div className='border rounded p-4'>
        <h2 className='font-medium mb-2'>{title}</h2>
        {!prs?.length && <div className='text-sm text-gray-500'>No open PRs.</div>}
        <div className='space-y-2'>
          {prs?.map(pr=> (
            <div key={pr.number} className='border rounded p-3'>
              <div className='flex justify-between gap-3'>
                <div className='truncate'>
                  <a className='font-medium underline' href={pr.html_url} target='_blank' rel='noreferrer'>#{pr.number} {pr.title}</a>
                  <div className='text-xs text-gray-600'>head <code>{pr.head}</code> → base <code>{pr.base}</code> {pr.draft && <span className='ml-2 px-2 py-0.5 text-xs border rounded'>draft</span>}</div>
                </div>
                <div className='text-xs'>{pr.mergeable_state||''}</div>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-2 mt-2'>
                <div className='text-xs'>
                  <div className='font-mono mb-1'>Statuses</div>
                  {(pr.statuses?.contexts||[]).map((c:any, i:number)=> (
                    <div key={i} className='flex items-center justify-between border rounded px-2 py-1'>
                      <div className='truncate'>{c.context}</div>
                      <div className='uppercase'>{c.state}</div>
                    </div>
                  ))}
                  {!pr.statuses?.contexts?.length && <div className='text-gray-500 text-xs'>No status contexts.</div>}
                </div>
                <div className='text-xs'>
                  <div className='font-mono mb-1'>Checks</div>
                  {(pr.checks||[]).map((c:any, i:number)=> (
                    <div key={i} className='flex items-center justify-between border rounded px-2 py-1'>
                      <a className='truncate underline' href={c.details_url} target='_blank' rel='noreferrer'>{c.name}</a>
                      <div>{c.conclusion||c.status}</div>
                    </div>
                  ))}
                  {!pr.checks?.length && <div className='text-gray-500 text-xs'>No check runs.</div>}
                </div>
              </div>
              {!!pr.labels?.length && <div className='mt-2 text-xs space-x-1'>{pr.labels.map(l=> <span key={l} className='px-2 py-0.5 border rounded'>{l}</span>)}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <h1 className='text-2xl font-semibold'>Release Monitor</h1>
      <div className='border rounded p-4 space-y-3'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <input className='border rounded px-3 py-2' placeholder='owner (org/user)' value={owner} onChange={e=>setOwner(e.target.value)} />
          <input className='border rounded px-3 py-2' placeholder='repo' value={repo} onChange={e=>setRepo(e.target.value)} />
          <input className='border rounded px-3 py-2' placeholder='main base (default: main)' value={base} onChange={e=>setBase(e.target.value)} />
          <input className='border rounded px-3 py-2' placeholder='release base (default: release/geo-mcp-v1)' value={rel} onChange={e=>setRel(e.target.value)} />
        </div>
        <button className='px-3 py-2 border rounded disabled:opacity-60' disabled={!owner||!repo||busy} onClick={load}>{busy?'Loading…':'Refresh'}</button>
        {err && <div className='text-sm text-red-600'>{err}</div>}
      </div>

      {data && (
        <div className='grid grid-cols-1 xl:grid-cols-2 gap-4'>
          <Section title={`PRs → ${data.releaseBranch}`} prs={data.releasePRs} />
          <Section title={`PRs → ${data.targetBranch}`} prs={data.mainPRs} />
        </div>
      )}

      <div className='text-xs text-gray-500'>Token source: env <code>GITHUB_TOKEN</code> or <code>server/secrets/integrations.local.json</code>.</div>
    </div>
  );
}
