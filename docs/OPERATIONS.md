# Operations

## Environments
- **Local**: Docker Desktop (optional), `.env.local` in `web-app/`
- **Staging/Prod**: Vercel or SSH host via `/api/deploy`

## Secrets
- Save tokens in CRM → **/settings/integrations** (gitignored under `server/secrets/`)
- For prod, use a proper secret manager (rotate tokens regularly)

## Release
- Use **Auto Merge Release** workflow (queue + auto-merge)
- Monitor in **/release/monitor**

## Rollback
- Use Selective Apply `.bak` restore
- For deploys, `docker compose -f <compose> rollback` (or re-up previous tag)

## Health
- `/health` UI or `geo doctor`
