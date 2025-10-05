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

  // Detect serverless environment (Vercel, AWS Lambda, etc.)
  const isServerless = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME);

  // Node
  results.push(ok('node.version', true, process.version));

  // Environment indicator
  results.push(ok('environment', true, isServerless ? 'serverless' : 'local'));

  // Docker (skip in serverless)
  if (!isServerless) {
    try{
      const d = spawnSync('docker', ['--version'], { encoding:'utf8' });
      results.push(ok('docker.present', d.status===0, (d.stdout||d.stderr||'').trim()));
    }catch{ results.push(ok('docker.present', false, 'docker not found in PATH')); }
  } else {
    results.push(ok('docker.present', true, 'skipped in serverless'));
  }

  // MCP build exists (skip in serverless)
  if (!isServerless) {
    const mcpDist = join(root, 'tools','geo-builders-mcp','dist','index.js');
    results.push(ok('mcp.dist.exists', existsSync(mcpDist), mcpDist));

    // Builders
    const builders = await listBuilders();
    results.push(ok('mcp.list_builders', !!builders?.ok, builders?.result||builders?.error));
  } else {
    results.push(ok('mcp.dist.exists', true, 'skipped in serverless'));
    results.push(ok('mcp.list_builders', true, 'skipped in serverless'));
  }

  // Web envs (public)
  const envNeeded = ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  const envReport: Record<string, boolean> = {};
  for (const k of envNeeded){ envReport[k] = !!process.env[k]; }
  results.push(ok('env.public.supabase', envReport.NEXT_PUBLIC_SUPABASE_URL && envReport.NEXT_PUBLIC_SUPABASE_ANON_KEY, envReport));

  // Secrets (use env vars in serverless, file in local)
  if (!isServerless) {
    const secrets = join(root, 'server','secrets','integrations.local.json');
    const hasSecrets = existsSync(secrets);
    let secretsKeys: any = null;
    if (hasSecrets){
      try{ const j = JSON.parse(await readFile(secrets,'utf8')); secretsKeys = Object.keys(j||{}); }catch{ secretsKeys = 'unreadable'; }
    }
    results.push(ok('secrets.integrations_file', hasSecrets, { path: secrets, keys: secretsKeys }));
  } else {
    // In serverless, check for key env vars instead of file
    const hasKeys = !!(process.env.GITHUB_TOKEN || process.env.VERCEL_TOKEN || process.env.ANTHROPIC_API_KEY);
    results.push(ok('secrets.integrations_file', hasKeys, isServerless ? 'using environment variables' : 'no secrets configured'));
  }

  // Overall
  const fail = results.some(r=> r.status==='fail');
  return NextResponse.json({ ok: !fail, results, environment: isServerless ? 'serverless' : 'local' });
}
