# GEO CLI

This CLI mirrors common Vercel flows but targets your CRM + MCP.

**Commands**
- `status` – ping `/api/health`, `/api/builds`, `/api/blueprints`.
- `build` – build MCP + web.
- `env --set KEY=VALUE ...` – append to `web-app/.env.local`.
- `deploy <verb>` – docker compose verbs via CRM API.
- `link --owner --repo [--vercel]` – GitHub↔Vercel linking via CRM API.
- `mcp` – call MCP tools directly (stdio).
- `blueprint [--run id]` – list or run blueprints.
- `release [--repo ORG/REPO]` – trigger staged release workflow.
- `logs [--service --tail]` – tail compose logs.
- `init` – opinionated blueprint run with autolink + first deploy.

Set a default base URL with `GEO_BASE_URL`.
