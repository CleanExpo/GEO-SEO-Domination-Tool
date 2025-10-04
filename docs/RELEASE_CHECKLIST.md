# Release Checklist (Safe Merge → main)

## 1) Create release branch
- Name: `release/geo-mcp-v1` (from `main`).

## 2) Open PRs → release branch (order)
1. feature/build-system-fix → feature/mcp-call-runner-fix → feature/mcp-server-core
2. Builders: api-route, database-schema, mcp-tool, supabase-setup, docker-compose, github-actions-ci
3. CRM modules: builds UI/API → integrations → link → deploy runner → remote-ssh-deploy
4. Safety: selective-apply → rollback
5. Blueprints: saas-starter (+with-db) → post-blueprint autolink+deploy
6. Scale & auth: redis-workers → supabase-auth → role-guards → api-role-guards → oauth
7. Billing: stripe-billing

## 3) Enable protections (run once)
- PowerShell:
```
$env:GITHUB_TOKEN='ghp_...'
./scripts/protect-branches.ps1 -Owner 'YOUR_ORG' -Repo 'YOUR_REPO'
```
- Bash:
```
export GITHUB_TOKEN=ghp_...
./scripts/protect-branches.sh YOUR_ORG YOUR_REPO
```
> Enforces: 1 review, required status check `build`, linear history, conversation resolution.

## 4) CI must pass on every PR
- Typecheck + Lint + Build for web-app
- MCP server builds (tsc)
- Smoke `/api/health` exists or is planned via blueprint

## 5) Staging preview
- Deploy `release/geo-mcp-v1` to Vercel Preview or SSH staging.
- Set staging env: SUPABASE (anon + service on server), optional REDIS_URL, Stripe (test), GitHub/Vercel tokens.

## 6) Clickthroughs
- Run "SaaS Starter" blueprint (Preview → Apply) then **Auto-Link** + **First Deploy**.
- Auth (OTP/OAuth), Roles (pro/admin), API role-guards.
- Billing: checkout (test price) + webhook → role becomes `pro`.

## 7) Rollback readiness
- Confirm selective-apply writes `.bak` and Rollback panel restores.

## 8) Cut release to main
- PR `release/geo-mcp-v1` → `main`, CI green, merge.
- Tag `v1.0.0`.

## 9) Post-merge smoke
- `/api/health` 200, pages render, protected routes behave.
