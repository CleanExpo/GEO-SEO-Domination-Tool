# Docker Web Image (Next.js 15 standalone)

This Dockerfile builds the **web-app** into a minimal standalone server and runs it on **port 3000**.

## Files
- `infra/docker/web.Dockerfile` — multi-stage (deps → build → runner)
- `.dockerignore` — trims build context

## Local test
```bash
# Build and run a single container (no compose)
docker build -f infra/docker/web.Dockerfile -t geo-web:local .
docker run --rm -p 3000:3000 geo-web:local
# Open: http://localhost:3000
```

## With Blue/Green compose
The existing blue/green compose file already references this Dockerfile:
```
services:
  web_blue:
    build:
      context: ../..
      dockerfile: infra/docker/web.Dockerfile
  web_green:
    build:
      context: ../..
      dockerfile: infra/docker/web.Dockerfile
```
Run:
```bash
docker compose -f infra/docker/compose.bluegreen.yml up -d --build reverse_proxy web_blue
# Switch traffic later to GREEN via CRM (/deploy/bluegreen) or CLI
```

## Env
- The compose setup uses `env_file: ../../geo-seo-domination-tool/web-app/.env.local` for runtime values.
- For local-only tests without compose, pass envs via `--env` flags or bake them into your environment.
