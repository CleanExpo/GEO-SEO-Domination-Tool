import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import fg from 'fast-glob';
import { join, resolve, relative, basename } from 'path';
import yaml from 'js-yaml';
import { renderTemplate, Engine } from '../engines/render.js';
import { ensureGitRepo, snapshot, diffPatch } from '../utils/git.js';
import { writeFileSafe, fileExists, readFileUtf8 } from '../utils/fsops.js';
import { makeUnifiedDiff } from '../utils/diff.js';

export type Strategy = 'safe-merge' | 'overwrite' | 'fail-on-conflict';

export async function applyBuilder(opts: {
  repoRoot: string;
  buildersRoot: string;
  id: string;
  variables?: Record<string, unknown>;
  strategy?: Strategy;
  engine?: Engine;
}) {
  const { repoRoot, buildersRoot, id } = opts;
  const variables = opts.variables ?? {};
  const strategy: Strategy = (opts.strategy as Strategy) || 'safe-merge';
  const engine: Engine = (opts.engine as Engine) || 'eta';

  const manifestJson = join(buildersRoot, id, 'manifest.json');
  const manifestYaml = join(buildersRoot, id, 'manifest.yaml');
  const existsJson = existsSync(manifestJson);
  const existsYaml = existsSync(manifestYaml);

  if (!existsJson && !existsYaml) {
    throw new Error(`Builder manifest not found for ${id}`);
  }

  const raw = await readFile(existsJson ? manifestJson : manifestYaml, 'utf8');
  const manifest: any = existsJson ? JSON.parse(raw) : yaml.load(raw);

  const templates: Array<{ from: string; to: string; engine?: Engine }> = manifest.templates || [];
  const root = join(buildersRoot, id);

  const git = await ensureGitRepo(repoRoot);
  const preRef = await snapshot(git, `pre-apply ${id}`);

  const applied: string[] = [];
  const skipped: string[] = [];
  const conflicts: string[] = [];
  const warnings: string[] = [];

  for (const t of templates) {
    const eng = (t.engine as Engine) || engine || 'eta';
    const absFromRoot = join(root, 'templates', t.from);
    const matches = await fg(absFromRoot.replace(/\\/g, '/'));

    for (const absFrom of matches) {
      const relFrom = relative(join(root, 'templates'), absFrom);
      const relTo = t.to.endsWith('/') ? join(t.to, basename(relFrom)) : t.to;
      const absTo = join(repoRoot, relTo);

      const rendered = await renderTemplate(eng, absFrom, variables);
      const exists = await fileExists(absTo);

      if (!exists) {
        await writeFileSafe(absTo, rendered);
        applied.push(relTo);
        continue;
      }

      const current = await readFileUtf8(absTo);
      if (current === rendered) {
        skipped.push(relTo);
        continue;
      }

      if (strategy === 'fail-on-conflict') {
        conflicts.push(relTo);
        continue;
      }

      if (strategy === 'safe-merge') {
        // Write a .patch alongside for manual review; do not overwrite existing file
        const patchPath = absTo + '.patch';
        const patch = makeUnifiedDiff(current, rendered, relTo);
        await writeFileSafe(patchPath, patch);
        warnings.push(`Conflict: wrote patch ${relTo}.patch (safe-merge)`);
        conflicts.push(relTo);
        continue;
      }

      if (strategy === 'overwrite') {
        await writeFileSafe(absTo, rendered);
        applied.push(relTo);
        continue;
      }
    }
  }

  // Create patch of everything done since snapshot
  const patch = await diffPatch(git);

  return {
    gitSnapshotRef: preRef,
    patch,
    applied,
    skipped,
    conflicts,
    warnings,
  };
}
