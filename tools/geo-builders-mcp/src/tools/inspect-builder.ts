/**
 * inspect_builder tool - Show manifest details for a specific builder
 */

import type { BuilderRegistry } from "../registry.js";
import type { BuilderInspectParams, InspectBuilderOutput } from "../types.js";

export async function inspectBuilder(
  registry: BuilderRegistry,
  params: BuilderInspectParams
): Promise<InspectBuilderOutput> {
  const { id } = params;

  const manifest = await registry.getBuilder(id);

  if (!manifest) {
    throw new Error(`Builder not found: ${id}`);
  }

  return {
    ...manifest,
    _source: {
      type: "local",
      path: `./builders/${id}`,
    },
  };
}
