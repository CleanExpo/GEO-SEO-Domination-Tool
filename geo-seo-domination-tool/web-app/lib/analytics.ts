import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import { join, resolve } from 'pathe';

const ROOT = resolve(process.cwd(), '..', '..');
const LOG_DIR = join(ROOT, 'server', 'logs', 'analytics');
const VIEWS_FILE = join(LOG_DIR, 'pageviews.ndjson');
const EVENTS_FILE = join(LOG_DIR, 'events.ndjson');

async function ensure(){ if(!existsSync(LOG_DIR)) await fs.mkdir(LOG_DIR, { recursive:true }); }

export async function recordView(data: { path:string; ts?: string; ua?: string; ref?: string; release?: string; color?: 'blue'|'green'|null }){
  await ensure();
  const line = JSON.stringify({ type:'view', ts: data.ts || new Date().toISOString(), ...data }) + '\n';
  await fs.appendFile(VIEWS_FILE, line, 'utf8');
}

export async function recordEvent(data: { name:string; payload?:any; ts?: string }){
  await ensure();
  const line = JSON.stringify({ type:'event', ts: data.ts || new Date().toISOString(), ...data }) + '\n';
  await fs.appendFile(EVENTS_FILE, line, 'utf8');
}

export async function readAll(){
  await ensure();
  const [v,e] = await Promise.allSettled([
    fs.readFile(VIEWS_FILE, 'utf8'),
    fs.readFile(EVENTS_FILE, 'utf8')
  ]);
  const parse = (s:string)=> s.split('\n').filter(Boolean).map(l=>{ try{return JSON.parse(l)}catch{return null}}).filter(Boolean);
  return {
    views: v.status==='fulfilled' ? parse(v.value) : [],
    events: e.status==='fulfilled' ? parse(e.value) : []
  };
}
