# Production Go-Live Checklist

## ✅ Completed Pre-Flight

- [x] Health diagnostics passed (`geo doctor`)
- [x] Database backups (N/A - using Supabase PostgreSQL)
- [x] Release tag stamped (`v1.0.0` in `server/release.env`)
- [x] Code pushed to GitHub (`main` branch)
- [x] Production provisioning script created
- [x] GHCR image path configured (`ghcr.io/cleanexpo/geo-seo-domination-tool/web:latest`)

## 🔄 CI/CD Build Status

**Check GitHub Actions:**
https://github.com/CleanExpo/GEO-SEO-Domination-Tool/actions

The workflow `Web Image (Build & Push)` should be running or complete. It triggers on:
- Push to `main` branch
- Changes to `web-app/**`, `infra/docker/web.Dockerfile`, or workflow file
- Manual dispatch

**Expected Artifacts:**
- Image: `ghcr.io/cleanexpo/geo-seo-domination-tool/web:latest`
- Tags: `latest`, `main`, `sha-<commit>`

## 🚀 Production Cutover Steps

### 1. Wait for CI/CD Build
```bash
# Check workflow status
# Go to: https://github.com/CleanExpo/GEO-SEO-Domination-Tool/actions
# Wait for "Web Image (Build & Push)" to complete (✓ green checkmark)
```

### 2. Provision Production Stack

**Option A: Public Image** (if GHCR image is public)
```powershell
pwsh scripts/deploy/provision-prod.ps1 -ReleaseTag v1.0.0 -PublicImage
```

**Option B: Private Image** (requires GitHub PAT with `read:packages`)
```powershell
# Generate PAT at: https://github.com/settings/tokens
# Select scope: read:packages

pwsh scripts/deploy/provision-prod.ps1 `
  -ReleaseTag v1.0.0 `
  -GhcrUser YourGitHubUsername `
  -GhcrToken ghp_YourPersonalAccessToken
```

**What This Does:**
- ✅ Validates Docker installation
- ✅ Creates Nginx active.conf (defaults to BLUE)
- ✅ Logs into GHCR (if private)
- ✅ Pulls and starts BLUE container
- ✅ Pulls and stages GREEN container
- ✅ Shows container status

### 3. Verify BLUE is Serving

```powershell
# Check containers
docker ps

# Test endpoint
curl http://localhost:8080/api/health
```

Expected: BLUE serving traffic on port 8080

### 4. Promote GREEN (Zero-Downtime Switch)

**Option A: Via Web UI**
1. Navigate to: http://localhost:8080/deploy/bluegreen
2. Click **"Pull GREEN (prod)"** (if not already pulled)
3. Click **"Up GREEN (prod)"**
4. Wait for GREEN to be healthy
5. Click **"Switch → GREEN (prod)"**

**Option B: Via CLI**
```powershell
# Pull latest GREEN image
geo bluegreen pull --target green --prod

# Start GREEN
geo bluegreen up --target green --prod

# Wait ~10 seconds for health checks

# Switch traffic
geo bluegreen switch --target green --prod
```

### 5. Verify Production

**Health Check:**
```powershell
curl http://localhost:8080/api/health
# Expected: {"status":"ok","timestamp":"...","color":"green"}
```

**Analytics Tracking:**
```powershell
curl http://localhost:8080/api/analytics
```
Or visit: http://localhost:8080/analytics

**Expected Analytics Data:**
- `release`: "v1.0.0"
- `color`: "green"
- Page views stamped with both values

### 6. Monitor and Keep BLUE Hot

**Container Status:**
```powershell
docker ps --filter "name=geo_web"
```

Expected:
- `geo_web_green` - **Up** (serving traffic)
- `geo_web_blue` - **Up** (hot standby for instant rollback)

**Instant Rollback (if needed):**
```powershell
geo bluegreen switch --target blue --prod
```
Or via UI: **"Switch → BLUE (prod)"**

## 📊 Post-Deployment Verification

### Critical Checks
- [ ] /api/health returns 200 OK
- [ ] /analytics shows views with release=v1.0.0, color=green
- [ ] Application loads without errors
- [ ] Database connectivity working
- [ ] All API endpoints functional

### Analytics Validation
```powershell
# Generate some traffic
start http://localhost:8080
# Click through a few pages

# Check analytics
curl http://localhost:8080/api/analytics | jq '.summary'
```

Expected output includes:
```json
{
  "views": [
    {
      "path": "/",
      "release": "v1.0.0",
      "color": "green"
    }
  ]
}
```

## 🧰 Suggested Hardening (Next Steps)

### 1. Uptime Monitoring
```powershell
# Create health check cron job
# Windows: Task Scheduler
# Linux: crontab

*/5 * * * * curl -f http://localhost:8080/api/health || echo "ALERT: Service down"
```

### 2. Log Rotation
```powershell
# Add to cleanup script
# Rotate server/logs/analytics/*.ndjson
# Keep last 30 days, compress older
```

### 3. Nightly Backups
```powershell
# Schedule via Task Scheduler/cron
0 2 * * * pwsh D:/GEO_SEO_Domination-Tool/scripts/backup/backup.ps1 -Target postgres
```

### 4. Environment Drift Detection
```powershell
# Add to geo doctor command
# Compare running containers vs git config
# Warn if env vars differ
```

## 🚨 Rollback Procedure

If issues are detected after switching to GREEN:

### Immediate Rollback (< 30 seconds)
```powershell
# Via CLI
geo bluegreen switch --target blue --prod

# Or via UI
# http://localhost:8080/deploy/bluegreen → "Switch → BLUE (prod)"
```

### Verify Rollback
```powershell
curl http://localhost:8080/api/health
# Should show color: "blue"

docker ps --filter "name=geo_web"
# Verify traffic is routing to BLUE
```

## 📝 Deployment Log

| Date | Version | Action | Result | Notes |
|------|---------|--------|--------|-------|
| 2025-10-04 | v1.0.0 | Initial deployment | Pending | Awaiting CI/CD build |
|  |  |  |  |  |

## 🔗 Important URLs

- **Repository**: https://github.com/CleanExpo/GEO-SEO-Domination-Tool
- **GitHub Actions**: https://github.com/CleanExpo/GEO-SEO-Domination-Tool/actions
- **GHCR Package**: https://github.com/CleanExpo/GEO-SEO-Domination-Tool/pkgs/container/geo-seo-domination-tool%2Fweb
- **Application**: http://localhost:8080
- **Blue/Green UI**: http://localhost:8080/deploy/bluegreen
- **Analytics**: http://localhost:8080/analytics
- **Health Check**: http://localhost:8080/api/health

## 📞 Support

If issues arise:
1. Check container logs: `docker logs geo_web_green`
2. Check Nginx logs: `docker logs geo_reverse_proxy`
3. Run diagnostics: `geo doctor`
4. Review documentation: `docs/PROVISION_PROD.md`
5. Rollback if necessary (see above)

---

**Status**: Ready for production cutover pending CI/CD build completion ✅
