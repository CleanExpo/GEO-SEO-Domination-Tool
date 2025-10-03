/**
 * preview_apply tool - Preview what apply_builder would do without making changes
 */

export async function previewApply(opts: {
  repoRoot: string;
  buildersRoot: string;
  id: string;
  variables?: Record<string, unknown>;
  flags?: Record<string, unknown>;
}) {
  // Stub implementation - to be implemented in future
  return {
    message: 'preview_apply not yet implemented - use apply_builder with dryRun parameter',
    suggestion: 'This tool will be implemented in a future update',
  };
}
