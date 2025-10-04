# Ship-It Runbook

This runbook guides a safe release:

## 0) Pre-flight
- `geo doctor` → PASS
- CI green on `main` (Release Monitor)
- Blue/Green UI reachable: `/deploy/bluegreen`

## 1) Back up data (choose your DB)
- SQLite: `pwsh scripts/backup/backup.ps1 -Target sqlite`
- Postgres (Supabase/self-hosted): `pwsh scripts/backup/backup.ps1 -Target postgres`

## 2) Build/Publish image (CI)
- Push to `main` or run **Web Image (Build & Push)** workflow.

## 3) Pull & stage GREEN (prod)
```powershell
pwsh scripts/deploy/pull-switch.ps1 -Target green -Prod
```
Validate on `http://<your-host>:8080`.

## 4) Switch traffic → GREEN (prod)
- In UI `/deploy/bluegreen` click **Switch → GREEN (prod)**
- Or: `pwsh scripts/deploy/pull-switch.ps1 -Target green -Prod`

## 5) Post-deploy checks
- `/health` → PASS
- Key pages OK; SEO Results load
- Release Monitor PRs merged/green

## 6) If anything breaks → Rollback
See **docs/ROLLBACK_PLAYBOOK.md**.
