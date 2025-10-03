# One-Click Link: GitHub ↔ Vercel

Prereqs: Save tokens in `/settings/integrations` first.

**API** `/api/link` actions:
- `github_create_repo` { name, description?, private? }
- `github_get_repo` { owner, name }
- `vercel_create_project` { name, repo: 'owner/name' }
- `vercel_get_project` { name }

**UI**: `/projects/builds` panel to create the repo and link a Vercel project.

Notes:
- Linking calls Vercel Projects API with `{ name, gitRepository: { type: 'github', repo: 'owner/name' } }`.
- After linking, Vercel typically auto-configures GitHub webhooks and first build.
- For production, migrate secrets from `server/secrets/` to a proper secret manager.
