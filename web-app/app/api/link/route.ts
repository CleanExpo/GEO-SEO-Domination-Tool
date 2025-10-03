import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';

const repoRoot = resolve(process.cwd(), '..', '..');
const secretsFile = join(repoRoot, 'server', 'secrets', 'integrations.local.json');

async function getTokens() {
  const envGithub = process.env.GITHUB_TOKEN || '';
  const envVercel = process.env.VERCEL_TOKEN || '';
  if (!existsSync(secretsFile)) return { githubToken: envGithub, vercelToken: envVercel };
  try {
    const raw = await readFile(secretsFile, 'utf8');
    const j = JSON.parse(raw);
    return { githubToken: j.githubToken || envGithub, vercelToken: j.vercelToken || envVercel };
  } catch {
    return { githubToken: envGithub, vercelToken: envVercel };
  }
}

async function ghCreateRepo(token: string, params: { name: string; description?: string; private?: boolean }) {
  const r = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'geo-builders-mcp' },
    body: JSON.stringify({ name: params.name, description: params.description || 'Created by GEO Builders', private: params.private ?? true })
  });
  const j = await r.json().catch(()=>null);
  return { ok: r.ok, status: r.status, json: j };
}

async function ghGetRepo(token: string, owner: string, name: string) {
  const r = await fetch(`https://api.github.com/repos/${owner}/${name}` , {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json', 'User-Agent': 'geo-builders-mcp' }
  });
  const j = await r.json().catch(()=>null);
  return { ok: r.ok, status: r.status, json: j };
}

// Create a Vercel project linked to a GitHub repo
// Docs-compatible body: { name, gitRepository: { type: 'github', repo: 'owner/name' } }
async function vercelCreateProject(token: string, params: { name: string; repo: string }) {
  const body = { name: params.name, gitRepository: { type: 'github', repo: params.repo } } as any;
  const r = await fetch('https://api.vercel.com/v10/projects', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const j = await r.json().catch(()=>null);
  return { ok: r.ok, status: r.status, json: j };
}

// Optional: fetch existing Vercel project by name
async function vercelGetProject(token: string, name: string) {
  const r = await fetch(`https://api.vercel.com/v9/projects/${encodeURIComponent(name)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const j = await r.json().catch(()=>null);
  return { ok: r.ok, status: r.status, json: j };
}

export async function POST(req: NextRequest) {
  try {
    const { action, params } = await req.json();
    if (!action) return NextResponse.json({ ok: false, error: 'Missing action' }, { status: 400 });
    const { githubToken, vercelToken } = await getTokens();

    if (action === 'github_create_repo') {
      if (!githubToken) return NextResponse.json({ ok: false, error: 'Missing GitHub token' }, { status: 400 });
      const name = String(params?.name || '').trim();
      if (!name) return NextResponse.json({ ok: false, error: 'Missing repo name' }, { status: 400 });
      const res = await ghCreateRepo(githubToken, { name, description: params?.description, private: params?.private });
      return NextResponse.json({ ok: res.ok, status: res.status, result: res.json }, { status: 200 });
    }

    if (action === 'github_get_repo') {
      if (!githubToken) return NextResponse.json({ ok: false, error: 'Missing GitHub token' }, { status: 400 });
      const owner = String(params?.owner || '').trim();
      const name = String(params?.name || '').trim();
      if (!owner || !name) return NextResponse.json({ ok: false, error: 'Missing owner or name' }, { status: 400 });
      const res = await ghGetRepo(githubToken, owner, name);
      return NextResponse.json({ ok: res.ok, status: res.status, result: res.json }, { status: 200 });
    }

    if (action === 'vercel_create_project') {
      if (!vercelToken) return NextResponse.json({ ok: false, error: 'Missing Vercel token' }, { status: 400 });
      const name = String(params?.name || '').trim();
      const repo = String(params?.repo || '').trim(); // format: owner/name
      if (!name || !repo) return NextResponse.json({ ok: false, error: 'Missing project name or repo (owner/name)' }, { status: 400 });
      const res = await vercelCreateProject(vercelToken, { name, repo });
      return NextResponse.json({ ok: res.ok, status: res.status, result: res.json }, { status: 200 });
    }

    if (action === 'vercel_get_project') {
      if (!vercelToken) return NextResponse.json({ ok: false, error: 'Missing Vercel token' }, { status: 400 });
      const name = String(params?.name || '').trim();
      if (!name) return NextResponse.json({ ok: false, error: 'Missing project name' }, { status: 400 });
      const res = await vercelGetProject(vercelToken, name);
      return NextResponse.json({ ok: res.ok, status: res.status, result: res.json }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: 'Unsupported action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Unknown error' }, { status: 500 });
  }
}
