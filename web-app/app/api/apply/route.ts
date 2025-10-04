import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { join } from 'pathe';
import { repoRoot, isAllowedRelPath, absFromRel, writeWithBackup } from '@/lib/paths';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mcpEntry(){ return join(repoRoot(), 'tools', 'geo-builders-mcp', 'dist', 'index.js'); }

function runPreview(builderId: string, variables: Record<string, any>){
  return new Promise<{ ok:boolean; result?: any; error?: string }>((resolve)=>{
    const child = spawn('node', [mcpEntry()], { stdio: ['pipe','pipe','pipe'] });
    let out = '';
    child.stdout.on('data', d => { out += String(d); });
    child.stderr.on('data', _d => {});
    const msg = JSON.stringify({ id: String(Date.now()), tool: 'preview_apply', params: { id: builderId, variables, strategy: 'safe-merge', engine: 'eta' } }) + '\n';
    child.stdin.write(msg); child.stdin.end();
    child.on('close', ()=>{
      try{ const lines = out.trim().split(/\r?\n/); const last = lines[lines.length-1]||'{}'; resolve(JSON.parse(last)); }
      catch(e:any){ resolve({ ok:false, error: e?.message||'parse_error' }); }
    });
  });
}

function getActiveWorkspace(req: NextRequest){ return req.cookies.get('active_workspace')?.value || null; }

export async function POST(req: NextRequest){
  const t0 = Date.now();
  try{
    const body = await req.json().catch(()=>({}));
    const id = String(body?.id || '');
    const variables = (body?.variables && typeof body.variables === 'object') ? body.variables : {};
    const files = Array.isArray(body?.files) ? body.files.map((s:any)=> String(s)) : [];
    if (!id) return NextResponse.json({ ok:false, error:'id required' }, { status:400 });
    if (!files.length) return NextResponse.json({ ok:false, error:'files required' }, { status:400 });

    // Get workspace and user for quota check
    const ws = getActiveWorkspace(req);
    if (!ws) return NextResponse.json({ ok:false, error:'workspace_required' }, { status:401 });

    const supa = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: { get: (n)=> req.cookies.get(n)?.value, set(){}, remove(){} }
      }
    );
    const { data: { user } } = await supa.auth.getUser();

    const preview = await runPreview(id, variables);
    if (!preview?.ok) return NextResponse.json({ ok:false, error: preview?.error || 'preview_failed' }, { status:500 });

    const generated = Array.isArray(preview?.result?.files) ? preview.result.files : [];

    const results: any[] = [];
    let wrote = 0;

    for (const wanted of files){
      const match = generated.find((f: any)=> String(f.to||f.path||'') === wanted);
      if (!match) { results.push({ to: wanted, ok:false, reason:'not_in_preview' }); continue; }
      const rel = wanted.replace(/\\/g,'/');
      if (!isAllowedRelPath(rel)) { results.push({ to: rel, ok:false, reason:'blocked_by_allowlist' }); continue; }
      const abs = absFromRel(rel);
      try{
        await writeWithBackup(abs, String(match.content||''));
        wrote++;
        results.push({ to: rel, ok:true });
      }catch(e:any){ results.push({ to: rel, ok:false, reason: e?.message||'write_failed' }); }
    }

    return NextResponse.json({ ok:true, result:{ wrote, results } }, { status:200 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'unknown error' }, { status:500 });
  }
}
