import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'pathe';

// ---- paths ----
const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');
const MCP_PATH = join(REPO_ROOT, 'tools', 'geo-builders-mcp', 'dist', 'index.js');
const TEMP_DIR = join(REPO_ROOT, 'server', 'temp');

// Allowed write roots (respecting your MCP allowlist)
const ALLOWLIST = [
  'web-app/', 'src/', 'database/', 'docs/', 'tools/', 'infra/', '.github/'
];

// ---- helpers ----
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

    let out = '';
    let err = '';
    server.stdout.on('data', (d) => { out += d.toString(); });
    server.stderr.on('data', (d) => { err += d.toString(); });

    server.on('close', () => {
      const line = out.split('\n').find((l) => l.trim().startsWith('{')) || out.trim();
      try {
        const parsed = JSON.parse(line);
        resolvePromise(parsed);
      } catch (e: any) {
        resolvePromise({ ok: false, error: { message: (e?.message || 'Parse error') + (err ? `\n${err}` : '') } });
      }
    });

    server.stdin.write(JSON.stringify(req) + '\n');
    server.stdin.end();
  });
}

// Compute unified diff using local git (no extra deps).
async function unifiedDiff(oldPath: string, newContent: string) {
  await ensureDir(TEMP_DIR);
  const tmpNew = join(TEMP_DIR, `preview-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
  await writeFile(tmpNew, newContent, 'utf8');
  // Use git --no-index to diff a real file vs temp content. If old doesn't exist, report as empty string.
  const oldExists = existsSync(oldPath);
  if (!oldExists) {
    // synthesize a minimal diff heading for new file
    return `--- /dev/null\n+++ ${oldPath}\n@@ NEW FILE @@\n`;
  }
  const args = ['--no-pager', 'diff', '--no-index', '--unified', oldPath, tmpNew];
  const { out } = await runSpawn('git', args, REPO_ROOT);
  return out || '';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params } = body || {};
    if (!action) return NextResponse.json({ ok: false, error: 'Missing action' }, { status: 400 });

    // --- existing MCP passthrough actions (kept) ---
    const passthrough = new Set(['list_builders','inspect_builder','preview_apply','apply_builder','post_install_check']);
    if (passthrough.has(action)) {
      const resp = await callMcp(action, params || {});
      return NextResponse.json(resp, { status: 200 });
    }

    // --- new: preview_conflicts ---
    if (action === 'preview_conflicts') {
      const { id, engine = 'eta', variables = {} } = params || {};
      if (!id) return NextResponse.json({ ok:false, error: 'Missing builder id' }, { status:400 });
      // Ask MCP to render what it WOULD write (no side effects)
      const preview = await callMcp('preview_apply', { id, engine, variables });
      if (!preview?.ok) return NextResponse.json(preview, { status: 200 });

      const items = (preview.result?.files || preview.result || []) as Array<{ to: string; content?: string }>;
      const results: any[] = [];
      for (const it of items) {
        const abs = join(REPO_ROOT, it.to);
        const exists = existsSync(abs);
        if (!exists) {
          results.push({ to: it.to, status: 'new', diff: await unifiedDiff(abs, it.content ?? '') });
          continue;
        }
        const current = await readFile(abs, 'utf8').catch(()=> '');
        const next = it.content ?? '';
        if (current === next) {
          results.push({ to: it.to, status: 'identical', diff: '' });
        } else {
          const diff = await unifiedDiff(abs, next);
          results.push({ to: it.to, status: 'modify', diff });
        }
      }
      return NextResponse.json({ ok:true, result:{ files: results } }, { status:200 });
    }

    // --- new: apply_plan (safe writes honoring per-file actions) ---
    if (action === 'apply_plan') {
      const { id, engine = 'eta', variables = {}, plan = [] } = params || {};
      if (!id) return NextResponse.json({ ok:false, error: 'Missing builder id' }, { status:400 });
      const preview = await callMcp('preview_apply', { id, engine, variables });
      if (!preview?.ok) return NextResponse.json(preview, { status: 200 });
      const files = (preview.result?.files || preview.result || []) as Array<{ to: string; content?: string }>;
      const planMap = new Map<string, string>();
      for (const p of plan) planMap.set(p.to, p.action);

      const writes: any[] = [];
      const skipped: any[] = [];
      for (const f of files) {
        const action = planMap.get(f.to) || 'skip';
        const abs = join(REPO_ROOT, f.to);
        const allowed = withinAllowlist(abs);
        if (!allowed) {
          skipped.push({ to: f.to, reason: 'outside-allowlist' });
          continue;
        }
        if (action === 'skip') { skipped.push({ to: f.to, reason: 'user-skip' }); continue; }
        await ensureDir(abs);
        await writeFile(abs, f.content ?? '', 'utf8');
        writes.push({ to: f.to, bytes: (f.content ?? '').length });
      }
      return NextResponse.json({ ok:true, result:{ wrote: writes, skipped } }, { status:200 });
    }

    return NextResponse.json({ ok:false, error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  // Convenience: GET /api/builds lists builders via MCP
  const resp = await callMcp('list_builders', {});
  return NextResponse.json(resp, { status: 200 });
}
