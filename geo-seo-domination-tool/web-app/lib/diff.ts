/* Minimal line-based unified diff generator (no deps). */
export type Hunk = { header: string; lines: string[] };

function lcs(a: string[], b: string[]) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out: Array<{ type: 'eq' | 'del' | 'add'; line: string }> = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push({ type: 'eq', line: a[i++] }); j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', line: a[i++] }); }
    else { out.push({ type: 'add', line: b[j++] }); }
  }
  while (i < n) out.push({ type: 'del', line: a[i++] });
  while (j < m) out.push({ type: 'add', line: b[j++] });
  return out;
}

export function unifiedDiff(before: string, after: string, filePath: string, context = 3) {
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);
  const seq = lcs(a, b);
  const hunks: Hunk[] = [];
  let buf: { startA: number; startB: number; countA: number; countB: number; lines: string[] } | null = null;
  let la = 1, lb = 1; // line counters (1-based)
  for (const it of seq) {
    const mark = it.type === 'eq' ? ' ' : it.type === 'del' ? '-' : '+';
    if (it.type === 'eq') {
      if (buf) {
        // keep limited context
        if (context > 0) {
          buf.lines.push(' ' + it.line);
          la++; lb++;
          if (buf.lines.filter(x => x[0] !== '+').filter(x => x[0] !== '-').length > context * 2 + 1) {
            // trim middle context (optional simple trim)
          }
        }
        if (buf.lines.length && buf.lines.slice(-context).every(l => l.startsWith(' '))) {
          // allow closing if next change is far; handled by opening a new hunk later
        }
      }
    }
    if (it.type !== 'eq') {
      if (!buf) { buf = { startA: la, startB: lb, countA: 0, countB: 0, lines: [] }; }
      buf.lines.push(mark + it.line);
      if (it.type === 'del') { la++; buf.countA++; }
      if (it.type === 'add') { lb++; buf.countB++; }
    } else {
      // equal
      if (buf) {
        buf.lines.push(' ' + it.line);
        la++; lb++;
        // if next ops are also equal, we let them accumulate; final pack down below
      } else { la++; lb++; }
    }
    // hunk flush heuristic: when last 2 lines are context and upcoming changes are not known (we don't peek), we'll flush later at end
  }
  if (buf) {
    // trim leading/trailing context to at most `context`
    const lead = [] as string[]; const core = [] as string[]; const trail = [] as string[];
    let seenChange = false; let recentCtx: string[] = [];
    for (const l of buf.lines) {
      if (l[0] === ' ' && !seenChange) lead.push(l);
      else { seenChange = true; core.push(l); }
    }
    // limit lead
    const leadTrim = lead.slice(-context);
    const trimmed = [...leadTrim, ...core];
    // limit trailing context
    let k = trimmed.length - 1; let ctxAfter = 0;
    while (k >= 0 && trimmed[k][0] === ' ' && ctxAfter < context) { k--; ctxAfter++; }
    const finalLines = trimmed.slice(0, k + 1 + ctxAfter);
    const hunk = {
      header: `@@ -${buf.startA},${Math.max(1, buf.countA || 1)} +${buf.startB},${Math.max(1, buf.countB || 1)} @@`,
      lines: finalLines
    };
    hunks.push(hunk);
  }
  const header = [`--- a/${filePath}`, `+++ b/${filePath}`];
  const text = [header[0], header[1], ...hunks.flatMap(h => [h.header, ...h.lines])].join('\n');
  return text;
}
