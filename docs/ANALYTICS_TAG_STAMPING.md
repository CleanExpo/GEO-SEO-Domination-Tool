# Analytics Tag Stamping

**Goal:** Include `NEXT_PUBLIC_RELEASE_TAG` and `NEXT_PUBLIC_TRAFFIC_COLOR` in every page view.

## How it works
- `server/release.env` holds `NEXT_PUBLIC_RELEASE_TAG=...`
- Compose files mount `env_file: ../../server/release.env` for both `web_blue` and `web_green`
- Each service also sets `NEXT_PUBLIC_TRAFFIC_COLOR=blue|green`
- Your client tracker already reads these envs and stamps views

## Set the tag
- UI: `/deploy/bluegreen` → **Release Tag** panel → Save → then **Up** the target color to recreate
- CLI/PS:
```powershell
pwsh scripts/release/stamp-env.ps1 -Tag v1.0.0
# then recreate your target color
geo bluegreen up --target green
```

**Note:** Switching traffic does not restart containers; you must **Up** a color after changing the tag to load new env.
