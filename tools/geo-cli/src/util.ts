import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function repoRoot(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  return resolve(__dirname, '../../..');
}

export function baseUrl(override?: string): string {
  return override || process.env.GEO_BASE_URL || 'http://localhost:3004';
}

export async function jget(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

export async function jpost(url: string, body: any): Promise<any> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return res.json();
}

export function sh(cmd: string, args: string[] = []): string {
  // Placeholder for shell execution
  return '';
}

export function pwsh(cmd: string): string {
  // Placeholder for PowerShell execution
  return '';
}
