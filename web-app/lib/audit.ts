import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'pathe';

const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');
const LOG_DIR = join(REPO_ROOT, 'server', 'logs');
const LOG_FILE = join(LOG_DIR, 'audit.json');

async function ensure(){ if(!existsSync(LOG_DIR)) await mkdir(LOG_DIR, { recursive: true }); if(!existsSync(LOG_FILE)) await writeFile(LOG_FILE, JSON.stringify({ events: [] }, null, 2), 'utf8'); }

export type AuditEvent = {
  ts: number;
  ip?: string | null;
  user?: { id?: string|null; email?: string|null };
  path: string;
  method: string;
  action?: string;
  ok: boolean;
  status: number;
  ms: number;
  meta?: any;
};

export async function appendAudit(ev: AuditEvent){
  await ensure();
  const j = JSON.parse(await readFile(LOG_FILE, 'utf8')) as { events: AuditEvent[] };
  j.events.push(ev);
  // keep last 10k
  if (j.events.length > 10000) j.events = j.events.slice(j.events.length - 10000);
  await writeFile(LOG_FILE, JSON.stringify(j, null, 2), 'utf8');
}

export async function readAudit(limit = 500){
  await ensure();
  const j = JSON.parse(await readFile(LOG_FILE, 'utf8')) as { events: AuditEvent[] };
  return j.events.slice(Math.max(0, j.events.length - limit));
}
