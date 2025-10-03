import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname } from 'path';

export async function writeFileSafe(absPath: string, content: string) {
  await mkdir(dirname(absPath), { recursive: true });
  await writeFile(absPath, content, 'utf8');
}

export async function fileExists(absPath: string) {
  return existsSync(absPath);
}

export async function readFileUtf8(absPath: string) {
  return readFile(absPath, 'utf8');
}
