import { NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'pathe';
import { spawnSync } from 'node:child_process';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ok(name:string, pass:boolean, detail?:any){
  return { name, status: pass?'pass':'fail', detail: detail ?? null };
}

async function listBuilders(){
  try{
    const root = resolve(process.cwd(), '..', '..');
    const entry = join(root, 'tools','geo-builders-mcp','dist','index.js');
    if (!existsSync(entry)) return { ok:false, error:'mcp_dist_missing' };
    const p = spawnSync('node', [entry], { input: JSON.stringify({ id: String(Date.now()), tool: 'list_builders', params: {} })+'\n', encoding:'utf8' });
    const lines = (p.stdout||'').trim().split(/\r?\n/);
    const last = lines.pop() || '{}';
    const j = JSON.parse(last);
    return j;
  }catch(e:any){ return { ok:false, error: e?.message||'mcp_error' }; }
}

export async function GET(){
  const results: any[] = [];
  const root = resolve(process.cwd(), '..', '..');

  // Node
  results.push(ok('node.version', true, process.version));

  // Docker (best-effort)
  try{
    const d = spawnSync('docker', ['--version'], { encoding:'utf8' });
    results.push(ok('docker.present', d.status===0, (d.stdout||d.stderr||'').trim()));
  }catch{ results.push(ok('docker.present', false, 'docker not found in PATH')); }

  // MCP build exists
  const mcpDist = join(root, 'tools','geo-builders-mcp','dist','index.js');
  results.push(ok('mcp.dist.exists', existsSync(mcpDist), mcpDist));

  // Builders
  const builders = await listBuilders();
  results.push(ok('mcp.list_builders', !!builders?.ok, builders?.result||builders?.error));

  // Web envs (public)
  const envNeeded = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const envReport: Record<string, boolean> = {};
  for (const k of envNeeded){ envReport[k] = !!process.env[k]; }
  results.push(ok('env.public.supabase', envReport.NEXT_PUBLIC_SUPABASE_URL && envReport.NEXT_PUBLIC_SUPABASE_ANON_KEY, envReport));

  // Secrets file presence (gitignored)
  const secrets = join(root, 'server','secrets','integrations.local.json');
  const hasSecrets = existsSync(secrets);
  let secretsKeys: any = null;
  if (hasSecrets){
    try{ const j = JSON.parse(await readFile(secrets,'utf8')); secretsKeys = Object.keys(j||{}); }catch{ secretsKeys = 'unreadable'; }
  }
  results.push(ok('secrets.integrations_file', hasSecrets, { path: secrets, keys: secretsKeys }));

  // Overall
  const fail = results.some(r=> r.status==='fail');
  return NextResponse.json({ ok: !fail, results });
}
