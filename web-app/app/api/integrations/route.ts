import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'pathe';

const repoRoot = resolve(process.cwd(), '..', '..');
const secretsDir = join(repoRoot, 'server', 'secrets');
const secretsFile = join(secretsDir, 'integrations.local.json');

async function loadSecrets() {
  if (!existsSync(secretsFile)) return { githubToken: '', vercelToken: '' } as any;
  const raw = await readFile(secretsFile, 'utf8');
  try { return JSON.parse(raw); } catch { return { githubToken: '', vercelToken: '' }; }
}

async function saveSecrets(obj: any) {
  if (!existsSync(secretsDir)) await mkdir(secretsDir, { recursive: true });
  await writeFile(secretsFile, JSON.stringify(obj, null, 2), 'utf8');
}

async function ghStatus(token: string) {
  if (!token) return { ok: false, error: 'missing token' };
  const r = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'geo-builders-mcp' } });
  const j = await r.json().catch(()=>null);
  return { ok: r.ok, status: r.status, user: j };
}

async function vercelStatus(token: string) {
  if (!token) return { ok: false, error: 'missing token' };
  const r = await fetch('https://api.vercel.com/v2/user', { headers: { Authorization: `Bearer ${token}` } });
  const j = await r.json().catch(()=>null);
  return { ok: r.ok, status: r.status, user: j };
}

async function supabaseStatus(url: string, anonKey: string) {
  if (!url || !anonKey) return { ok: false, error: 'missing url or anon key' };
  // Lightweight health endpoint for Supabase Auth
  const r = await fetch(`${url.replace(/\/$/, '')}/auth/v1/health`, {
    headers: { apikey: anonKey }
  });
  let j: any = null; try { j = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, body: j };
}

export async function GET() {
  const s = await loadSecrets();
  return NextResponse.json({ ok: true, result: { hasGithub: !!s.githubToken, hasVercel: !!s.vercelToken } }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params } = body || {};
    if (!action) return NextResponse.json({ ok: false, error: 'Missing action' }, { status: 400 });

    if (action === 'save_tokens') {
      const prev = await loadSecrets();
      const next = { ...prev, githubToken: params?.githubToken ?? prev.githubToken, vercelToken: params?.vercelToken ?? prev.vercelToken };
      await saveSecrets(next);
      return NextResponse.json({ ok: true, result: { saved: true } }, { status: 200 });
    }

    if (action === 'status') {
      const s = await loadSecrets();
      const gh = await ghStatus(s.githubToken || process.env.GITHUB_TOKEN || '');
      const vz = await vercelStatus(s.vercelToken || process.env.VERCEL_TOKEN || '');
      return NextResponse.json({ ok: true, result: { github: gh, vercel: vz } }, { status: 200 });
    }

    if (action === 'save_supabase') {
      const prev = await loadSecrets();
      const next = { ...prev, supabaseUrl: params?.supabaseUrl ?? prev.supabaseUrl, supabaseAnonKey: params?.supabaseAnonKey ?? prev.supabaseAnonKey };
      await saveSecrets(next);
      return NextResponse.json({ ok: true, result: { saved: true } }, { status: 200 });
    }

    if (action === 'supabase_status') {
      const s = await loadSecrets();
      const url = (params?.supabaseUrl ?? s.supabaseUrl ?? process.env.SUPABASE_URL ?? '').toString();
      const anon = (params?.supabaseAnonKey ?? s.supabaseAnonKey ?? process.env.SUPABASE_ANON_KEY ?? '').toString();
      const st = await supabaseStatus(url, anon);
      return NextResponse.json({ ok: true, result: st }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
