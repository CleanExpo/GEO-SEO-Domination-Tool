import { resolve, join, basename } from 'pathe';
import { existsSync } from 'node:fs';
import { readdir, readFile, mkdir } from 'node:fs/promises';

const ROOT = resolve(process.cwd(), '..', '..');
export const SEO_DIR = join(ROOT, 'server', 'logs', 'seo');

/**
 * Ensure SEO directory exists
 */
export async function ensureSeoDir() {
  if (!existsSync(SEO_DIR)) {
    await mkdir(SEO_DIR, { recursive: true });
  }
}

/**
 * List all SEO result files (crawl, audit, clusters)
 * @returns Sorted array of file names
 */
export async function listSeoFiles() {
  await ensureSeoDir();
  const all = await readdir(SEO_DIR);
  return all
    .filter(f => /^(crawl|audit|clusters)-\d+\.(json|csv)$/.test(f))
    .sort();
}

/**
 * Read SEO file content
 * @param name File name (without directory path)
 * @returns File path and content
 */
export async function readSeoFile(name: string) {
  await ensureSeoDir();
  const p = join(SEO_DIR, basename(name));
  const buf = await readFile(p);
  return { path: p, content: buf.toString('utf8') };
}
