import { createRequire } from 'module';
import { readFileUtf8 } from '../utils/fsops.js';

const require = createRequire(import.meta.url);
const { Eta } = require('eta');

export type Engine = 'eta' | 'handlebars';

const eta = new Eta({
  autoEscape: false,
  autoTrim: false,
});

export async function renderTemplate(
  engine: Engine,
  templatePath: string,
  variables: Record<string, unknown>
): Promise<string> {
  const templateContent = await readFileUtf8(templatePath);

  if (engine === 'eta') {
    const rendered = eta.renderString(templateContent, variables);

    if (typeof rendered !== 'string') {
      throw new Error('Eta render did not return a string');
    }

    return rendered;
  }

  if (engine === 'handlebars') {
    throw new Error('Handlebars engine not yet implemented');
  }

  throw new Error(`Unknown template engine: ${engine}`);
}
