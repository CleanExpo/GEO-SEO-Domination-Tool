# Jobs & Progress (Client-Driven)

**What**: A tiny job store so long actions show a progress bar and logs in the CRM. The client orchestrates the work and reports progress.

## API: `/api/jobs`
`POST` with one of:
- `start` `{ title }` → `{ id }`
- `log` `{ id, line }`
- `progress` `{ id, pct, step }`
- `complete` `{ id, result? }`
- `fail` `{ id, error }`
- `cancel` `{ id }`
- `status` `{ id }`

`GET /api/jobs` → last 50 jobs.

Jobs persist in `server/temp/jobs.json`.

## UI
**Projects → Builds → Jobs & Progress** has a button: **Sync All (bundle → scp → unpack → up)**. It:
1) `start` → get job id
2) calls `/api/sync sync_all`
3) logs JSON output, sets `progress` steps, then `complete` (or `fail`).

You can wrap any flow by following the same pattern from `runSyncAllJob()` in the page.
