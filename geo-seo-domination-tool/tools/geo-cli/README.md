# geo — Vercel-like CLI for the GEO CRM

## Install
```powershell
cd tools/geo-cli
npm install
npm run build
npm link
```
> On Windows, this makes `geo` available in your terminal.

## Usage
```bash
geo --help
geo status --base-url http://localhost:3000
geo build
geo env --set NEXT_PUBLIC_SUPABASE_URL=http://... NEXT_PUBLIC_SUPABASE_ANON_KEY=...
geo link --owner your-org --repo my-saas --vercel my-saas
geo mcp --tool list_builders
geo mcp --tool apply_builder --id nextjs-api-route --variables '{"ROUTE_NAME":"health"}'
geo blueprint --run saas-starter --owner your-org --repo my-saas
geo deploy up --args -d
geo logs --service web --tail 200
geo release --repo your-org/your-repo
geo init --id saas-starter --owner your-org --repo my-saas
```

## Env
- `GEO_BASE_URL` (defaults to `http://localhost:3000`).

## Notes
- `release` delegates to `scripts/trigger-workflow.ps1` (works on Windows; on macOS/Linux ensure `pwsh` is installed or run via GitHub UI).
