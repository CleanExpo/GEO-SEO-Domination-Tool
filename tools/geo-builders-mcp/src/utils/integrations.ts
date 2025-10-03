import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'pathe';

const repoRoot = resolve(process.cwd());
const secretsFile = join(repoRoot, 'server', 'secrets', 'integrations.local.json');

export async function readIntegrationTokens() {
  const envGitHub = process.env.GITHUB_TOKEN || '';
  const envVercel = process.env.VERCEL_TOKEN || '';
  if (!existsSync(secretsFile)) return { githubToken: envGitHub, vercelToken: envVercel };
  try {
    const raw = await readFile(secretsFile, 'utf8');
    const j = JSON.parse(raw);
    return { githubToken: j.githubToken || envGitHub, vercelToken: j.vercelToken || envVercel };
  } catch {
    return { githubToken: envGitHub, vercelToken: envVercel };
  }
}
