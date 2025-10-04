import { getGitHubToken } from '@/lib/secrets';

export function ghHeaders(){
  const t = getGitHubToken();
  if (!t) throw new Error('Missing GitHub token. Save it in /settings/integrations or set GITHUB_TOKEN.');
  return { Authorization: `Bearer ${t}`, Accept: 'application/vnd.github+json' } as Record<string,string>;
}
