# Docker & CI via Builders

Use CRM → Projects → Builds to **Preview/Apply**:
- `docker-compose` → adds `infra/docker/web.Dockerfile` and `infra/docker/compose.yml`
- `github-actions-ci` → adds `.github/workflows/ci.yml` and `docker-publish.yml`

Run locally:
```bash
docker compose -f infra/docker/compose.yml build
docker compose -f infra/docker/compose.yml up -d
```

CI:
- Push to `main` to run build
- Trigger `Docker Publish` via **workflow_dispatch** or pushing a tag `vX.Y.Z`
- Set registry secrets in repo settings for pushes
