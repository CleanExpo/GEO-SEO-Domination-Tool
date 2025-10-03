import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { join, resolve } from 'pathe';

// Compute MCP server path relative to web-app (no hardcoded drive letters)
function getMcpPath() {
  // web-app -> repo root: ../..
  const fromWebToRoot = resolve(process.cwd(), '..', '..');
  return join(fromWebToRoot, 'tools', 'geo-builders-mcp', 'dist', 'index.js');
}

async function callMcp(tool: string, params: any = {}) {
  return await new Promise<{ ok: boolean; result?: any; error?: { message: string } }>((resolvePromise) => {
    const nodePath = process.execPath; // the Node running Next.js API
    const server = spawn(nodePath, [getMcpPath()], { stdio: ['pipe', 'pipe', 'pipe'] });
    const req = { id: String(Date.now()), tool, params };

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params } = body || {};
    if (!action) return NextResponse.json({ ok: false, error: 'Missing action' }, { status: 400 });

    // Whitelist allowed tools
    const allowed = new Set(['list_builders', 'inspect_builder', 'preview_apply', 'apply_builder', 'post_install_check']);
    if (!allowed.has(action)) return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });

    const resp = await callMcp(action, params || {});
    return NextResponse.json(resp, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}

export async function GET() {
  // Convenience: GET /api/builds lists builders
  const resp = await callMcp('list_builders', {});
  return NextResponse.json(resp, { status: 200 });
}
