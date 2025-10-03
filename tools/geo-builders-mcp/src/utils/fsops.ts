import fse from 'fs-extra';
import { dirname } from 'path';

export async function writeFileSafe(absPath: string, content: string) {
  await fse.ensureDir(dirname(absPath));
  await fse.writeFile(absPath, content, 'utf8');
}

export async function fileExists(absPath: string) {
  return fse.pathExists(absPath);
}

export async function readFileUtf8(absPath: string) {
  return fse.readFile(absPath, 'utf8');
}
