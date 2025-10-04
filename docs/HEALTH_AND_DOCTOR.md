# Health & Doctor

## UI
- Visit **/health** to see pass/fail and details for:
  - Node version
  - Docker presence (best-effort)
  - MCP dist exists
  - MCP list_builders returns OK
  - Public Supabase envs present
  - Local secrets file present

## API
- `GET /api/health` → `{ ok, results: [{ name, status, detail }] }`

## CLI
```bash
# From repo root after linking geo CLI
geo doctor --base-url http://localhost:3000
```
- Prints local checks + calls `/api/health`.
- Suggests exact commands to fix common issues.
