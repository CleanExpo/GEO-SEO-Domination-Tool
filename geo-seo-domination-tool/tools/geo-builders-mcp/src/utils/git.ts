import simpleGit from 'simple-git';
import { join } from 'path';

export async function ensureGitRepo(repoRoot: string) {
  const git = simpleGit(repoRoot);
  const isRepo = await git.checkIsRepo();
  if (!isRepo) throw new Error('Not a Git repository: ' + repoRoot);
  return git;
}

export async function snapshot(git: ReturnType<typeof simpleGit>, label: string) {
  await git.add(['.']);
  const msg = `[mcp] snapshot: ${label}`;
  await git.commit(msg, { '--no-verify': null });
  const head = await git.revparse(['HEAD']);
  return head.trim();
}

export async function diffPatch(git: ReturnType<typeof simpleGit>) {
  return await git.diff(['HEAD']);
}
