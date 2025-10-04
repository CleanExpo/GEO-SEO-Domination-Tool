import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';
import { unifiedDiff } from '@/lib/diff';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function repoRoot(){ const WEB_CWD = process.cwd(); return resolve(WEB_CWD, '..', '..'); }
function mcpEntry(){ return join(repoRoot(), 'tools', 'geo-builders-mcp', 'dist', 'index.js'); }

import { spawn } from 'node:child_process';
function runPreview(builderId: string, variables: Record<string, any>){
  return new Promise<{ ok:boolean; result?: any; error?: string }>((resolve)=>{
    const child = spawn('node', [mcpEntry()], { stdio: ['pipe','pipe','pipe'] });
    let out = '';
    child.stdout.on('data', d => { out += String(d); });
    child.stderr.on('data', d => { /* ignore */ });
    const msg = JSON.stringify({ id: String(Date.now()), tool: 'preview_apply', params: { id: builderId, variables, strategy: 'safe-merge', engine: 'eta' } }) + '\n';
    child.stdin.write(msg); child.stdin.end();
    child.on('close', ()=>{
      try{
        const lines = out.trim().split(/\r?\n/);
        const last = lines[lines.length - 1] || '{}';
        const json = JSON.parse(last);
        resolve(json);
      }catch(e:any){ resolve({ ok:false, error: e?.message || 'parse_error' }); }
    });
  });
}

async function readExisting(pathRel: string){
  const abs = join(repoRoot(), pathRel);
  if (!existsSync(abs)) return { exists: false, content: '' } as const;
  try { return { exists: true, content: await readFile(abs, 'utf8') } as const; }
  catch { return { exists: true, content: '' } as const; }
}

export async function POST(req: NextRequest){
  try{
    const body = await req.json().catch(()=>({}));
    const builderId = String(body?.id || '');
    const variables = (body?.variables && typeof body.variables === 'object') ? body.variables : {};
    if (!builderId) return NextResponse.json({ ok:false, error:'id required' }, { status:400 });

    const preview = await runPreview(builderId, variables);
    if (!preview?.ok) return NextResponse.json({ ok:false, error: preview?.error || 'preview_failed' }, { status:500 });

    const files = Array.isArray(preview?.result?.files) ? preview.result.files : [];
    const out: any[] = [];

    for (const f of files){
      const to = String(f.to || f.path || '');
      if (!to) continue;
      const nextContent = String(f.content || '');
      const exist = await readExisting(to);
      const before = exist.content;
      const after = nextContent;
      const same = before === after;
      const status: 'create'|'modify'|'skip' = same ? 'skip' : (exist.exists ? 'modify' : 'create');
      const diff = same ? '' : unifiedDiff(before, after, to, 3);
      out.push({ to, status, exists: exist.exists, bytes: { before: before.length, after: after.length }, diff });
    }

    return NextResponse.json({ ok:true, result:{ files: out } }, { status:200 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'unknown error' }, { status:500 });
  }
}
