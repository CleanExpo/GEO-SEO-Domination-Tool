import { NextRequest, NextResponse } from 'next/server';
import { ghHeaders } from '@/lib/gh';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function jget(url: string, headers: Record<string,string>){
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

export async function GET(req: NextRequest){
  try{
    const u = new URL(req.url);
    const owner = String(u.searchParams.get('owner')||'').trim();
    const repo  = String(u.searchParams.get('repo')||'').trim();
    const baseA = (u.searchParams.get('base')||'main').toString();
    const baseB = (u.searchParams.get('release')||'release/geo-mcp-v1').toString();
    if (!owner || !repo) return NextResponse.json({ ok:false, error:'owner/repo required' }, { status:400 });
    const h = ghHeaders();

    async function listPRs(base: string){
      const q = new URLSearchParams({ state:'open', per_page:'50', base });
      const prs = await jget(`https://api.github.com/repos/${owner}/${repo}/pulls?${q}`, h);
      // augment with checks and mergeability
      const out = [] as any[];
      for (const pr of prs){
        let checks:any = null; let combined:any = null; let mergeable_state = pr.mergeable_state || null;
        try { combined = await jget(`https://api.github.com/repos/${owner}/${repo}/commits/${pr.head.sha}/status`, h); } catch {}
        try { checks = await jget(`https://api.github.com/repos/${owner}/${repo}/commits/${pr.head.sha}/check-runs`, { ...h, Accept: 'application/vnd.github.antiope+json' }); } catch {}
        out.push({
          number: pr.number,
          title: pr.title,
          head: pr.head.ref,
          base: pr.base.ref,
          draft: pr.draft,
          mergeable_state,
          labels: (pr.labels||[]).map((l:any)=> l.name),
          html_url: pr.html_url,
          statuses: {
            state: combined?.state || null,
            contexts: (combined?.statuses||[]).map((s:any)=> ({ context: s.context, state: s.state, target_url: s.target_url }))
          },
          checks: (checks?.check_runs||[]).map((c:any)=> ({ name: c.name, status: c.status, conclusion: c.conclusion, details_url: c.details_url }))
        });
      }
      return out;
    }

    const [releasePRs, mainPRs] = await Promise.all([ listPRs(baseB), listPRs(baseA) ]);
    return NextResponse.json({ ok:true, result:{ releaseBranch: baseB, targetBranch: baseA, releasePRs, mainPRs } });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'error' }, { status:500 });
  }
}
