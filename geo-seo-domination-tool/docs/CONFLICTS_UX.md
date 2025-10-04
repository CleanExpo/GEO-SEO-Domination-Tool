# Conflicts UX & Dry-Run

This feature lets you preview every file a builder would touch, see a **unified diff** (via `git diff --no-index`), choose **write** or **skip** per-file, and then **Apply Plan** safely.

## API
`POST /api/builds` actions:
- `preview_conflicts` { id, engine?, variables? } → `{ files: [{ to, status: new|identical|modify, diff }] }`
- `apply_plan` { id, engine?, variables?, plan: [{ to, action: write|skip }] } → writes only allowed files inside allowlist

## Allowlist
Writes are constrained to: `web-app/`, `src/`, `database/`, `docs/`, `tools/`, `infra/`, `.github/` (relative to repo root).

## UI
On **Projects → Builds**:
1. Select a builder and set variables
2. Click **Preview Conflicts**
3. Review statuses and diffs; set decisions
4. Click **Apply Plan**

Notes:
- Diffs are computed using your local Git (no extra deps)
- Temporary preview files live under `server/temp/`
