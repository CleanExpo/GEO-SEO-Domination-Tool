# Provision Production (GHCR + Blue/Green)

This script prepares a host to run the **production** blue/green stack pulling images from GitHub Container Registry (GHCR).

## Prerequisites

### One-time Setup
- **Docker Engine** installed and running
- If your GHCR image is **private**, generate a Personal Access Token (PAT) with **read:packages** scope

### Generate GitHub PAT (if needed)
1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scope: `read:packages`
4. Copy the token

## Usage

### Public Image (No Authentication)
If your GHCR image is public:
```powershell
pwsh scripts/deploy/provision-prod.ps1 -ReleaseTag v1.0.0 -PublicImage
```

### Private Image (Requires Authentication)
If your GHCR image is private:
```powershell
pwsh scripts/deploy/provision-prod.ps1 `
  -ReleaseTag v1.0.0 `
  -GhcrUser YourGitHubUsername `
  -GhcrToken ghp_YourPersonalAccessToken
```

Or set environment variables:
```powershell
$env:GITHUB_ACTOR = "YourGitHubUsername"
$env:GITHUB_TOKEN = "ghp_YourPersonalAccessToken"
pwsh scripts/deploy/provision-prod.ps1 -ReleaseTag v1.0.0
```

## What the Script Does

1. **Validates Environment**
   - Checks Docker is installed
   - Verifies compose file exists

2. **Configures Nginx**
   - Creates `active.conf` from template if missing
   - Defaults traffic to BLUE

3. **Stamps Release Tag**
   - Creates `server/release.env` with `NEXT_PUBLIC_RELEASE_TAG=v1.0.0`
   - This tag is injected into containers for analytics tracking

4. **GHCR Authentication** (if private)
   - Logs into `ghcr.io` using provided credentials

5. **Starts Blue/Green Stack**
   - Brings up `reverse_proxy` and `web_blue` (active)
   - Pulls and starts `web_green` (staged)

6. **Verifies Deployment**
   - Shows `docker compose ps` output
   - Displays access instructions

## Post-Deployment

### Access the Application
```
http://localhost:8080
```

### Switch Traffic to GREEN
1. Navigate to `/deploy/bluegreen` in your application
2. Use the "prod controls" panel
3. Click "Switch → GREEN (prod)"

### Update Release Tag
If you deploy a new version:
```powershell
# Update the tag
pwsh scripts/deploy/provision-prod.ps1 -ReleaseTag v1.0.1

# Recreate containers to pick up new tag
pwsh scripts/deploy/provision-prod.ps1 -ReleaseTag v1.0.1
```

## Troubleshooting

### "GHCR token missing" Error
You need to either:
- Use `-PublicImage` flag if image is public
- Provide `-GhcrToken` with valid PAT
- Set `$env:GITHUB_TOKEN` environment variable

### "Compose file not found" Error
Run the script from the repository root directory.

### Container Health Issues
Check logs:
```powershell
docker logs geo_web_blue
docker logs geo_web_green
docker logs geo_reverse_proxy
```

### Port 8080 Already in Use
Either:
- Stop the conflicting service
- Use a different port: `-ProxyPort 8081`

## Parameters Reference

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| `-Compose` | Path to compose file | `infra/docker/compose.bluegreen.prod.yml` | No |
| `-ReleaseTag` | Version tag to stamp | `v1.0.0` | No |
| `-ProxyPort` | Nginx proxy port | `8080` | No |
| `-PublicImage` | Skip GHCR authentication | `false` | No |
| `-GhcrUser` | GitHub username | `$env:GITHUB_ACTOR` | If private |
| `-GhcrToken` | GitHub PAT with read:packages | `$env:GITHUB_TOKEN` | If private |

## Next Steps

After provisioning:
1. ✅ Verify BLUE is serving at http://localhost:8080
2. ✅ Test the application functionality
3. ✅ Switch traffic to GREEN via `/deploy/bluegreen`
4. ✅ Monitor analytics at `/analytics`
5. ✅ Keep BLUE as instant rollback option
