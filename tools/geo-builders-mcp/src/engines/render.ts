import { readFile } from 'fs/promises';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// eta is CJS; load via require to avoid ESM resolver quirks on Windows
const { Eta } = require('eta');
import Handlebars from 'handlebars';

export type Engine = 'eta' | 'handlebars';

const eta = new Eta({ useWith: true, autoEscape: false });

export async function renderTemplate(engine: Engine, absTemplatePath: string, vars: Record<string, unknown>): Promise<string> {
  const raw = await readFile(absTemplatePath, 'utf8');
  return renderInline(engine, raw, vars);
}

export function renderInline(engine: Engine, raw: string, vars: Record<string, unknown>): string {
  if (engine === 'handlebars') {
    const tpl = Handlebars.compile(raw, { noEscape: true });
    return tpl(vars);
  }
  return eta.renderString(raw, vars) ?? '';
}
