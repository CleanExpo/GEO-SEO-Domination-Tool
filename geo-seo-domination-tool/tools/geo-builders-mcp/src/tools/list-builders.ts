/**
 * list_builders tool - List available builders from configured sources
 */

import type { BuilderRegistry } from "../registry.js";
import type { BuilderListParams, ListBuildersOutput } from "../types.js";

export async function listBuilders(
  registry: BuilderRegistry,
  params: BuilderListParams
): Promise<ListBuildersOutput> {
  // Filter by tags if provided
  const builders = params.tags
    ? await registry.filterByTags(params.tags)
    : await registry.discoverBuilders();

  return {
    builders,
  };
}
