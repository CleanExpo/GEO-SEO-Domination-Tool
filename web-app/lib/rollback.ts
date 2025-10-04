import { existsSync, statSync } from 'node:fs';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'pathe';
import { WRITE_ALLOW, repoRoot } from '@/lib/paths';

export type BakEntry = { bak: string; target: string; bytesBak: number; bytesTarget: number|null; mtimeMs: number };

async function listDirRecursive(dirAbs: string, relPrefix: string, out: BakEntry[]){
  const items = await readdir(dirAbs, { withFileTypes: true });
  for (const it of items){
    const abs = join(dirAbs, it.name);
    const rel = relPrefix ? `${relPrefix}/${it.name}` : it.name;
    if (it.isDirectory()) { await listDirRecursive(abs, rel, out); continue; }
    if (it.isFile() && rel.endsWith('.bak')){
      const targetRel = rel.slice(0, -4); // remove .bak
      const st = statSync(abs);
      const tAbs = join(repoRoot(), targetRel);
      const tBytes = existsSync(tAbs) ? statSync(tAbs).size : null;
      out.push({ bak: rel.replace(/\\/g,'/'), target: targetRel.replace(/\\/g,'/'), bytesBak: st.size, bytesTarget: tBytes, mtimeMs: st.mtimeMs });
    }
  }
}

export async function listBackups(): Promise<BakEntry[]>{
  const out: BakEntry[] = [];
  for (const prefix of WRITE_ALLOW){
    const abs = join(repoRoot(), prefix);
    if (!existsSync(abs)) continue;
    await listDirRecursive(abs, prefix.replace(/\\/g,'/').replace(/\/$/, ''), out);
  }
  out.sort((a,b)=> b.mtimeMs - a.mtimeMs);
  return out;
}

export async function restoreBackup(targetRel: string){
  const norm = targetRel.replace(/\\/g,'/');
  // safety: must be inside allowlist
  if (!WRITE_ALLOW.some(p=> norm.startsWith(p))) throw new Error('blocked_by_allowlist');
  const bakRel = `${norm}.bak`;
  const bakAbs = join(repoRoot(), bakRel);
  const tgtAbs = join(repoRoot(), norm);
  if (!existsSync(bakAbs)) throw new Error('bak_not_found');
  const content = await readFile(bakAbs, 'utf8');
  await writeFile(tgtAbs, content, 'utf8');
  return { ok: true as const };
}
