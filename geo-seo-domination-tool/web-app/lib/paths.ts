import { existsSync } from 'node:fs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { join, resolve } from 'pathe';

const WEB_CWD = process.cwd();
const REPO_ROOT = resolve(WEB_CWD, '..', '..');

// Adapted allowlist for your repo structure
export const WRITE_ALLOW = [
  'web-app/',
  'src/',
  'database/',
  'docs/',
  'tools/'
];

export function repoRoot(){ return REPO_ROOT; }

export function isAllowedRelPath(rel: string){
  const norm = rel.replace(/\\/g,'/');
  return WRITE_ALLOW.some(prefix => norm.startsWith(prefix));
}

export function absFromRel(rel: string){ return join(REPO_ROOT, rel); }

export async function ensureDirFor(fileAbs: string){
  const dir = dirname(fileAbs);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

export async function writeWithBackup(fileAbs: string, content: string){
  await ensureDirFor(fileAbs);
  if (existsSync(fileAbs)){
    const prev = await readFile(fileAbs, 'utf8').catch(()=> '');
    const bak = fileAbs + '.bak';
    await writeFile(bak, prev, 'utf8');
  }
  await writeFile(fileAbs, content, 'utf8');
}
