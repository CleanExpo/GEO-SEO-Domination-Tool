import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'pathe';

const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');
const DIR = join(REPO_ROOT, 'server', 'temp');

export async function readJSON<T=any>(file: string, fallback: T): Promise<T>{
  const p = join(DIR, file);
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
  if (!existsSync(p)) { await writeFile(p, JSON.stringify(fallback, null, 2), 'utf8'); return fallback; }
  try { return JSON.parse(await readFile(p, 'utf8')) as T; } catch { return fallback; }
}

export async function writeJSON<T=any>(file: string, data: T){
  const p = join(DIR, file);
  if (!existsSync(DIR)) await mkdir(DIR, { recursive: true });
  await writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}
