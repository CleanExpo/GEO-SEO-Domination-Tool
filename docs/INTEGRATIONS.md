# Integrations (GitHub + Vercel)

API: `/api/integrations` with actions:
- `save_tokens` { githubToken?, vercelToken? }
- `status`

UI: `/settings/integrations` — save tokens locally and check status.

Dev secrets are written to `server/secrets/integrations.local.json` (gitignored). For production use a proper secret manager.
