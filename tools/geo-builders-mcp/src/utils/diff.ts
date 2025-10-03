/**
 * Create a unified diff between two strings
 */
export function makeUnifiedDiff(
  original: string,
  modified: string,
  filename: string
): string {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  let diff = `--- ${filename}\n+++ ${filename}\n`;

  // Simple line-by-line diff (basic implementation)
  const maxLines = Math.max(originalLines.length, modifiedLines.length);
  let hunks: string[] = [];
  let currentHunk: string[] = [];
  let hunkStart = 0;

  for (let i = 0; i < maxLines; i++) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[i];

    if (origLine !== modLine) {
      if (currentHunk.length === 0) {
        hunkStart = i;
      }

      if (origLine !== undefined) {
        currentHunk.push(`-${origLine}`);
      }
      if (modLine !== undefined) {
        currentHunk.push(`+${modLine}`);
      }
    } else if (currentHunk.length > 0) {
      // End of hunk
      hunks.push(`@@ -${hunkStart + 1},${currentHunk.filter(l => l.startsWith('-')).length} +${hunkStart + 1},${currentHunk.filter(l => l.startsWith('+')).length} @@\n${currentHunk.join('\n')}`);
      currentHunk = [];
    }
  }

  // Add final hunk if exists
  if (currentHunk.length > 0) {
    hunks.push(`@@ -${hunkStart + 1},${currentHunk.filter(l => l.startsWith('-')).length} +${hunkStart + 1},${currentHunk.filter(l => l.startsWith('+')).length} @@\n${currentHunk.join('\n')}`);
  }

  diff += hunks.join('\n');
  return diff;
}
