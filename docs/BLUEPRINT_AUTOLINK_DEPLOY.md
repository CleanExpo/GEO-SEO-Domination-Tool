# Post-Blueprint: Auto-Link + First Deploy

This adds an orchestration API and UI so a blueprint can finish by creating a GitHub repo, linking a Vercel project, and running a first Docker Compose deploy.

## Endpoints
- `GET /api/blueprints` → list available blueprints (from `/blueprints/*.json`).
- `POST /api/blueprints` → `{ id, autolink, deploy, githubOwner, githubRepo, vercelProject? }`
  - Runs each step via MCP `apply_builder`.
  - If `autolink`, calls `/api/autolink`.
  - If `deploy`, calls `/api/deploy` with `up -d`.

## UI
- `/projects/catalog` now includes toggles for **Auto-Link** and **First Deploy** plus owner/repo inputs.

## Notes
- Requires tokens saved in **/settings/integrations** (GitHub + Vercel) for Auto-Link.
- Requires Docker Compose locally for First Deploy.
- Blueprint steps must reference existing builder IDs.
