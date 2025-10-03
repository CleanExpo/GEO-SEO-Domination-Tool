import { promises as fs } from 'fs';
import fg from 'fast-glob';
import path, { join, relative } from 'pathe';
import { renderTemplate, Engine, renderInline } from '../engines/render.js';
import { makeUnifiedDiff } from '../utils/diff.js';
import ignore from 'ignore';

export type PreviewFlags = { overwrite?: boolean; engine?: Engine; respectGitIgnore?: boolean };

export async function previewApply(opts: { repoRoot: string; buildersRoot: string; id: string; variables?: Record<string, unknown>; flags?: PreviewFlags }) {
  const { repoRoot, buildersRoot, id } = opts;
  const variables = opts.variables ?? {};
  const flags: PreviewFlags = { overwrite: false, engine: 'eta', respectGitIgnore: true, ...(opts.flags||{}) };

  const manifestPath = join(buildersRoot, id, 'builder.manifest.json');
  const yamlPath = join(buildersRoot, id, 'builder.manifest.yaml');
  let manifestRaw: any;
  try {
    const existsJson = await fileExists(manifestPath);
    const existsYaml = await fileExists(yamlPath);
    if (!existsJson && !existsYaml) throw new Error(`Builder manifest not found for ${id}`);
    manifestRaw = existsJson ? JSON.parse(await fs.readFile(manifestPath, 'utf8')) : (await import('js-yaml')).load(await fs.readFile(yamlPath, 'utf8'));
  } catch (e:any) {
    return { plan: [], warnings: [String(e?.message || e)] };
  }

  const templates = (manifestRaw.templates||[]) as Array<{ from:string; to:string; engine?:Engine }>;
  const root = join(buildersRoot, id);

  // gitignore handling
  let ig: ignore.Ignore | null = null;
  if (flags.respectGitIgnore) {
    const giPath = join(repoRoot, '.gitignore');
    if (await fileExists(giPath)) ig = ignore().add(await fs.readFile(giPath,'utf8'));
  }

  const plan: Array<{op:'create'|'modify'|'skip'|'conflict'; path:string; reason?:string; diff?:string}> = [];
  for (const t of templates) {
    const engine = (t.engine as Engine) || (flags.engine as Engine) || 'eta';
    const absFromRoot = join(root, t.from);
    const matches = await fg(absFromRoot.replace(/\\/g,'/'));
    for (const absFrom of matches) {
      const relFrom = path.relative(join(root), absFrom);
      const relToRendered = renderInline(engine, t.to, variables);
      const relTo = t.to.endsWith('/') ? join(relToRendered, path.basename(relFrom).replace(/\.eta$/,'')) : relToRendered;
      const absTo = join(repoRoot, relTo);

      if (ig && ig.ignores(relTo)) { plan.push({ op:'skip', path: relTo, reason: 'ignored by .gitignore' }); continue; }

      const rendered = await renderTemplate(engine, absFrom, variables);
      const exists = await fileExists(absTo);
      if (!exists) { plan.push({ op:'create', path: relTo, diff: makeUnifiedDiff('', rendered, relTo) }); continue; }

      const current = await fs.readFile(absTo, 'utf8');
      if (current === rendered) { plan.push({ op:'skip', path: relTo, reason: 'no changes' }); continue; }

      if (!flags.overwrite) { plan.push({ op:'conflict', path: relTo, reason: 'exists and overwrite=false', diff: makeUnifiedDiff(current, rendered, relTo) }); continue; }

      plan.push({ op:'modify', path: relTo, diff: makeUnifiedDiff(current, rendered, relTo) });
    }
  }

  return { plan, warnings: [] };
}

async function fileExists(p:string){ try{ await fs.access(p); return true; } catch{ return false; } }
