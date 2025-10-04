import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'pathe';

export function getGitHubToken(){
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const root = resolve(process.cwd(), '..', '..');
    const file = join(root, 'server', 'secrets', 'integrations.local.json');
    if (existsSync(file)){
      const j = JSON.parse(readFileSync(file, 'utf8'));
      return j?.github?.token || j?.GITHUB_TOKEN || null;
    }
  } catch {}
  return null;
}

export function ghHeaders(){
  const t = getGitHubToken();
  if (!t) throw new Error('Missing GitHub token. Save it in /settings/integrations or set GITHUB_TOKEN.');
  return { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' } as Record<string,string>;
}
