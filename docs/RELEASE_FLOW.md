# Release Flow

1) **Pre-flight**: `geo doctor`, CI green, backups
2) **Notes (optional)**: `geo release notes --repo YOUR_ORG/YOUR_REPO --version v1.0.0`
3) **Tag & Release**: `geo release tag --repo YOUR_ORG/YOUR_REPO --version v1.0.0`
4) **CI builds** Docker image → GHCR (already configured)
5) **Prod deploy**: pull & switch to GREEN (UI or `scripts/deploy/pull-switch.ps1 -Target green -Prod`)
