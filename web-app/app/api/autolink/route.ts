import { NextRequest, NextResponse } from 'next/server';
import { enforceQuota, recordOk, ensureCapsForActiveWorkspace } from '@/lib/quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function callLink(body: any){
  const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/link`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) });
  // Fallback to relative if NEXT_PUBLIC_BASE_URL not set
  if (!r.ok && (!process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL === '')){
    const r2 = await fetch('/api/link', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(body) } as any);
    return r2.json();
  }
  return r.json();
}

export async function POST(req: NextRequest){
  const t0 = Date.now();
  try{
    await ensureCapsForActiveWorkspace(req);
    const gate = await enforceQuota(req, 'api_call' as any, 1);
    if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

    const body = await req.json().catch(()=>({}));
    const owner = String(body?.owner||'').trim();
    const repo = String(body?.repo||'').trim();
    const isPrivate = Boolean(body?.private ?? true);
    const vercelProject = String(body?.vercelProject||repo).trim();

    if (!owner || !repo) return NextResponse.json({ ok:false, error:'owner and repo required' }, { status:400 });

    const logs: string[] = [];

    // 1) Create GitHub repo (idempotent behavior handled by /api/link implementation)
    logs.push(`Creating GitHub repo ${owner}/${repo} private=${isPrivate}`);
    const gh = await callLink({ action:'github_create_repo', owner, repo, private: isPrivate });
    if (!gh?.ok) return NextResponse.json({ ok:false, error: gh?.error||'github_create_repo_failed', logs }, { status:502 });
    logs.push('GitHub repository ready');

    // 2) Create Vercel project linked to that repo
    logs.push(`Creating Vercel project ${vercelProject} (repo=${owner}/${repo})`);
    const vp = await callLink({ action:'vercel_create_project', projectName: vercelProject, repoPath: `${owner}/${repo}` });
    if (!vp?.ok) return NextResponse.json({ ok:false, error: vp?.error||'vercel_create_project_failed', logs }, { status:502 });
    logs.push('Vercel project linked');

    await recordOk(gate.ws!, 'api_call' as any, 1, { action:'autolink', owner, repo, vercelProject });
    return NextResponse.json({ ok:true, result:{ owner, repo, vercelProject, logs } }, { status:200 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message||'unknown error' }, { status:500 });
  }
}
