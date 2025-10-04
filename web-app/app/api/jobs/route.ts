import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';

const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');
const TEMP_DIR = join(REPO_ROOT, 'server', 'temp');
const STORE = join(TEMP_DIR, 'jobs.json');

type Job = {
  id: string;
  status: 'queued'|'running'|'completed'|'failed'|'canceled';
  title?: string;
  pct?: number; // 0..100
  step?: string;
  logs: string[];
  result?: any;
  error?: string;
  createdAt: number;
  updatedAt: number;
};

async function ensureStore(){
  if (!existsSync(TEMP_DIR)) await mkdir(TEMP_DIR, { recursive: true });
  if (!existsSync(STORE)) await writeFile(STORE, JSON.stringify({ jobs: [] }, null, 2), 'utf8');
}
async function load(){ await ensureStore(); const j = JSON.parse(await readFile(STORE,'utf8')); return j as { jobs: Job[] }; }
async function save(db:{ jobs: Job[] }){ await writeFile(STORE, JSON.stringify(db, null, 2), 'utf8'); }
function find(db:{ jobs: Job[] }, id:string){ return db.jobs.find(j=> j.id===id); }

export async function GET(){
  const db = await load();
  const jobs = db.jobs.sort((a,b)=> b.updatedAt - a.updatedAt).slice(0,50);
  return NextResponse.json({ ok:true, result:{ jobs } }, { status:200 });
}

export async function POST(req: NextRequest){
  try{
    const { action, params } = await req.json();
    const db = await load();

    if (action === 'start'){
      const id = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
      const now = Date.now();
      const job: Job = { id, status:'running', title: params?.title || 'Job', pct: 0, step:'starting', logs: [], createdAt: now, updatedAt: now };
      db.jobs.push(job); await save(db);
      return NextResponse.json({ ok:true, result:{ id } }, { status:200 });
    }

    if (action === 'log'){
      const { id, line } = params || {}; const j = find(db, id);
      if (!j) return NextResponse.json({ ok:false, error:'job not found' }, { status:404 });
      j.logs.push(String(line ?? ''));
      j.updatedAt = Date.now();
      if (j.status === 'queued') j.status = 'running';
      await save(db);
      return NextResponse.json({ ok:true }, { status:200 });
    }

    if (action === 'progress'){
      const { id, pct, step } = params || {}; const j = find(db, id);
      if (!j) return NextResponse.json({ ok:false, error:'job not found' }, { status:404 });
      if (typeof pct === 'number') j.pct = Math.max(0, Math.min(100, pct));
      if (typeof step === 'string') j.step = step;
      j.updatedAt = Date.now();
      await save(db);
      return NextResponse.json({ ok:true }, { status:200 });
    }

    if (action === 'complete'){
      const { id, result } = params || {}; const j = find(db, id);
      if (!j) return NextResponse.json({ ok:false, error:'job not found' }, { status:404 });
      j.status = 'completed'; j.pct = 100; j.step = 'done'; j.result = result; j.updatedAt = Date.now();
      await save(db);
      return NextResponse.json({ ok:true }, { status:200 });
    }

    if (action === 'fail'){
      const { id, error } = params || {}; const j = find(db, id);
      if (!j) return NextResponse.json({ ok:false, error:'job not found' }, { status:404 });
      j.status = 'failed'; j.step = 'error'; j.error = String(error || 'failed'); j.updatedAt = Date.now();
      await save(db);
      return NextResponse.json({ ok:true }, { status:200 });
    }

    if (action === 'cancel'){
      const { id } = params || {}; const j = find(db, id);
      if (!j) return NextResponse.json({ ok:false, error:'job not found' }, { status:404 });
      j.status = 'canceled'; j.step = 'canceled'; j.updatedAt = Date.now();
      await save(db);
      return NextResponse.json({ ok:true }, { status:200 });
    }

    if (action === 'status'){
      const { id } = params || {}; const j = find(db, id);
      if (!j) return NextResponse.json({ ok:false, error:'job not found' }, { status:404 });
      return NextResponse.json({ ok:true, result:{ job: j } }, { status:200 });
    }

    return NextResponse.json({ ok:false, error:'unsupported action' }, { status:400 });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'Unknown error' }, { status:500 });
  }
}
