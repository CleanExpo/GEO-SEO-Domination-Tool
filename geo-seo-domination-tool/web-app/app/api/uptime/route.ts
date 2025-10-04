import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROOT = resolve(process.cwd(), '..', '..');
const LOG_DIR = join(ROOT, 'server', 'logs', 'uptime');
const LOG_FILE = join(LOG_DIR, 'pings.ndjson');

async function ensure(){ if(!existsSync(LOG_DIR)) await fs.mkdir(LOG_DIR, { recursive:true }); }

export async function GET(){
  await ensure();
  const raw = existsSync(LOG_FILE) ? await fs.readFile(LOG_FILE, 'utf8') : '';
  const rows = raw.split('\n').filter(Boolean).map(l=>{ try {return JSON.parse(l)} catch {return null} }).filter(Boolean);
  const last24 = Date.now() - 24*60*60*1000;
  const recent = rows.filter(r => new Date(r.ts).getTime() >= last24);
  const okCount = recent.filter(r => r.ok).length;
  const total = recent.length || 1;
  const availability = Math.round((okCount/total)*10000)/100; // % with 2 decimals
  return NextResponse.json({ ok:true, availability24h: availability, samples: recent.slice(-200) });
}

export async function POST(req: NextRequest){
  await ensure();
  const body = await req.json().catch(()=>({}));
  const line = JSON.stringify({ ts: new Date().toISOString(), ok: !!body.ok, ms: body.ms ?? null, code: body.code ?? null, err: body.err ?? '' }) + '\n';
  await fs.appendFile(LOG_FILE, line, 'utf8');
  return NextResponse.json({ ok:true });
}
