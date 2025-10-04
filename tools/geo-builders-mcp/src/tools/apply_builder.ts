import fg from 'fast-glob';
import { join, relative, basename } from 'pathe';
import { renderTemplate, Engine, renderInline } from '../engines/render.js';
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

  const manifestJson = join(buildersRoot, id, 'builder.manifest.json');
  const manifestYaml = join(buildersRoot, id, 'builder.manifest.yaml');
  const existsJson = await fileExists(manifestJson);
  const existsYaml = await fileExists(manifestYaml);
  if (!existsJson && !existsYaml) throw new Error(`Builder manifest not found for ${id}`);
  const raw = await readFileUtf8(existsJson ? manifestJson : manifestYaml);
  let manifest: any;
  if (existsJson) {
    manifest = JSON.parse(raw);
  } else {
    const yaml = await import('js-yaml');
    manifest = yaml.load(raw);
  }

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
    const absFromRoot = join(root, t.from);
    const matches = await fg(absFromRoot.replace(/\\/g,'/'));
    for (const absFrom of matches) {
      const relFrom = relative(root, absFrom);
      const relToRendered = renderInline(eng, t.to, variables);
      const relTo = t.to.endsWith('/') ? join(relToRendered, basename(relFrom).replace(/\.eta$/,'')) : relToRendered;
      const absTo = join(repoRoot, relTo);

      const rendered = await renderTemplate(eng, absFrom, variables);
      const exists = await fileExists(absTo);

      if (!exists) { await writeFileSafe(absTo, rendered); applied.push(relTo); continue; }

      const current = await readFileUtf8(absTo);
      if (current === rendered) { skipped.push(relTo); continue; }

      if (strategy === 'fail-on-conflict') { conflicts.push(relTo); continue; }

      if (strategy === 'safe-merge') {
        const patchPath = absTo + '.patch';
        const patch = makeUnifiedDiff(current, rendered, relTo);
        await writeFileSafe(patchPath, patch);
        warnings.push(`Conflict: wrote patch ${relTo}.patch (safe-merge)`);
        conflicts.push(relTo);
        continue;
      }

      // overwrite
      await writeFileSafe(absTo, rendered); applied.push(relTo);
    }
  }

  const patch = await diffPatch(git);
  return { gitSnapshotRef: preRef, patch, applied, skipped, conflicts, warnings };
}
