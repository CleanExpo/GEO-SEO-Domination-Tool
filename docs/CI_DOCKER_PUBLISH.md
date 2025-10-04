# CI — Build & Push Web Image

This workflow builds the Next.js **web-app** image and pushes to **GitHub Container Registry (GHCR)**.

## Setup
1. Replace placeholders in `infra/docker/compose.bluegreen.prod.yml`:
   - `YOUR_ORG/YOUR_REPO` → your org/repo path
2. Ensure repo has permission to push packages (default for GHCR via `GITHUB_TOKEN`).
3. (Optional) Protect `main` and use Merge Queue—workflow triggers on `main`.

## Tags
- `sha-<commit>` always
- Branch name tag (e.g., `main`)
- Tag name on releases
- `latest` on default branch

## Deploy (pull & switch)
- From CRM **/deploy/bluegreen**: send `{ action: 'pull', target: 'green', prod: true }` then `{ action: 'switch', target: 'green', prod: true }`.
- PowerShell script:
  ```powershell
  pwsh scripts/deploy/pull-switch.ps1 -Target green -Prod
  ```

## Compose (production)
- Use `infra/docker/compose.bluegreen.prod.yml` to pull images by tag and run behind Nginx.
