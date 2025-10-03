import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'pathe';
import { spawn } from 'node:child_process';

const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');
const MCP_PATH = join(REPO_ROOT, 'tools', 'geo-builders-mcp', 'dist', 'index.js');
const BLUEPRINTS_DIR = join(REPO_ROOT, 'blueprints');
const TEMP_DIR = join(REPO_ROOT, 'server', 'temp');
const ALLOWLIST = [ 'web-app/', 'src/', 'database/', 'docs/', 'tools/', 'infra/', '.github/' ];

function withinAllowlist(absTarget: string) {
  const rel = relative(REPO_ROOT, absTarget).replace(/\\/g, '/');
  return ALLOWLIST.some(prefix => rel.startsWith(prefix));
}
async function ensureDir(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}
function runSpawn(cmd: string, args: string[], cwd: string) {
  return new Promise<{ code:number; out:string; err:string }>((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: true });
    let out = ''; let err = '';
    child.stdout.on('data', d => out += d.toString());
    child.stderr.on('data', d => err += d.toString());
    child.on('close', code => resolve({ code: code ?? 1, out, err }));
  });
}
async function callMcp(tool: string, params: any = {}) {
  return await new Promise<{ ok: boolean; result?: any; error?: { message: string } }>((resolvePromise) => {
    const nodePath = process.execPath;
    const server = spawn(nodePath, [MCP_PATH], { stdio: ['pipe', 'pipe', 'pipe'] });
    const req = { id: String(Date.now()), tool, params } as any;
    let out = ''; let err = '';
    server.stdout.on('data', (d) => { out += d.toString(); });
    server.stderr.on('data', (d) => { err += d.toString(); });
    server.on('close', () => {
      const line = out.split('\n').find((l) => l.trim().startsWith('{')) || out.trim();
      try { const parsed = JSON.parse(line); resolvePromise(parsed); } catch (e:any) { resolvePromise({ ok:false, error:{ message:(e?.message||'Parse error') + (err?`\n${err}`:'') } }); }
    });
    server.stdin.write(JSON.stringify(req) + '\n');
    server.stdin.end();
  });
}
async function unifiedDiff(oldPath: string, newContent: string) {
  await ensureDir(TEMP_DIR);
  const tmp = join(TEMP_DIR, `bp-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  await writeFile(tmp, newContent, 'utf8');
  if (!existsSync(oldPath)) return `--- /dev/null\n+++ ${oldPath}\n@@ NEW FILE @@\n`;
  const { out } = await runSpawn('git', ['--no-pager','diff','--no-index','--unified', oldPath, tmp], REPO_ROOT);
  return out || '';
}
async function listBlueprints() {
  if (!existsSync(BLUEPRINTS_DIR)) return [] as any[];
  const files = await readdir(BLUEPRINTS_DIR);
  const jsons = files.filter(f => f.endsWith('.json'));
  const out:any[] = [];
  for (const f of jsons) {
    try { const j = JSON.parse(await readFile(join(BLUEPRINTS_DIR,f),'utf8')); out.push({ id:j.id, title:j.title, summary:j.summary, file: f }); } catch {}
  }
  return out;
}
function resolveEnvVars(obj:any) {
  // Replace ${env:NAME} with process.env.NAME
  const s = JSON.stringify(obj);
  const r = s.replace(/\$\{env:([A-Z0-9_]+)\}/g, (_,name) => process.env[name] || '');
  return JSON.parse(r);
}

export async function GET() {
  const list = await listBlueprints();
  return NextResponse.json({ ok:true, result:{ blueprints: list } }, { status:200 });
}

export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();
    if (action === 'list') {
      const list = await listBlueprints();
      return NextResponse.json({ ok:true, result:{ blueprints: list } }, { status:200 });
    }
    if (action === 'preview') {
      const id = params?.id as string;
      if (!id) return NextResponse.json({ ok:false, error:'Missing blueprint id' }, { status:400 });
      const filePath = join(BLUEPRINTS_DIR, `${id}.json`);
      if (!existsSync(filePath)) return NextResponse.json({ ok:false, error:'Blueprint not found' }, { status:404 });
      const bp = resolveEnvVars(JSON.parse(await readFile(filePath,'utf8')));
      const filesAgg: any[] = [];
      for (const step of (bp.steps||[])) {
        const p = await callMcp('preview_apply', { id: step.builder, engine:'eta', variables: step.variables||{} });
        if (!p?.ok) return NextResponse.json({ ok:false, error:`Preview failed for ${step.builder}` }, { status:200 });
        const items = (p.result?.files || p.result || []) as Array<{ to:string; content?:string }>;
        for (const it of items) filesAgg.push({ ...it, builder: step.builder });
      }
      // Build per-file status+diff
      const result: any[] = [];
      for (const f of filesAgg) {
        const abs = join(REPO_ROOT, f.to);
        const exists = existsSync(abs);
        if (!exists) { result.push({ to:f.to, builder:f.builder, status:'new', diff: await unifiedDiff(abs, f.content||'') }); continue; }
        const cur = await readFile(abs,'utf8').catch(()=> '');
        const next = f.content||'';
        if (cur === next) result.push({ to:f.to, builder:f.builder, status:'identical', diff:'' });
        else result.push({ to:f.to, builder:f.builder, status:'modify', diff: await unifiedDiff(abs,next) });
      }
      return NextResponse.json({ ok:true, result:{ files: result } }, { status:200 });
    }
    if (action === 'apply') {
      const id = params?.id as string;
      const selections = params?.selections as Array<{ to:string; action:'write'|'skip' }> | undefined;
      if (!id) return NextResponse.json({ ok:false, error:'Missing blueprint id' }, { status:400 });
      const filePath = join(BLUEPRINTS_DIR, `${id}.json`);
      if (!existsSync(filePath)) return NextResponse.json({ ok:false, error:'Blueprint not found' }, { status:404 });
      const bp = resolveEnvVars(JSON.parse(await readFile(filePath,'utf8')));
      const planMap = new Map<string,'write'|'skip'>();
      (selections||[]).forEach(s=> planMap.set(s.to, s.action));

      // Render all files again and write honoring allowlist & selections
      const writes:any[] = []; const skipped:any[] = [];
      for (const step of (bp.steps||[])) {
        const p = await callMcp('preview_apply', { id: step.builder, engine:'eta', variables: step.variables||{} });
        if (!p?.ok) return NextResponse.json({ ok:false, error:`Preview failed for ${step.builder}` }, { status:200 });
        const items = (p.result?.files || p.result || []) as Array<{ to:string; content?:string }>;
        for (const it of items) {
          const abs = join(REPO_ROOT, it.to);
          if (!withinAllowlist(abs)) { skipped.push({ to:it.to, reason:'outside-allowlist' }); continue; }
          const decision = planMap.get(it.to) || 'write';
          if (decision === 'skip') { skipped.push({ to:it.to, reason:'user-skip' }); continue; }
          await ensureDir(abs);
          await writeFile(abs, it.content||'', 'utf8');
          writes.push({ to:it.to, bytes:(it.content||'').length });
        }
      }
      return NextResponse.json({ ok:true, result:{ wrote:writes, skipped } }, { status:200 });
    }

    return NextResponse.json({ ok:false, error:'Unsupported action' }, { status:400 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'Unknown error' }, { status:500 });
  }
}
