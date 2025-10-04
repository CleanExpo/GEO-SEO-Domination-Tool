# Health Repair

Fixes common failures:
- **mcp.dist.exists**: builds `tools/geo-builders-mcp` and verifies `dist/index.js`
- **secrets.integrations_file**: creates `server/secrets/integrations.local.json` (pulls tokens from env when present)

## Usage
```powershell
pwsh scripts/fix/repair-health.ps1
start http://localhost:3004/health
```

> The secrets file is gitignored. Populate tokens later in **/settings/integrations** or set env vars.
