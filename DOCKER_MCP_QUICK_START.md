# Docker MCP Quick Start Guide

**Get browser automation MCPs running in 5 minutes!**

---

## ✅ Prerequisites Checklist

- [ ] Docker Desktop installed
- [ ] Docker Desktop is **running**
- [ ] At least 4GB RAM available
- [ ] Git Bash or PowerShell

---

## 🚀 3-Step Setup

### Step 1: Start MCP Servers (1 minute)

**Windows PowerShell**:
```powershell
cd d:\GEO_SEO_Domination-Tool\docker\mcp-servers
.\start-mcp-servers.ps1
```

**Git Bash/Linux/macOS**:
```bash
cd docker/mcp-servers
chmod +x start-mcp-servers.sh
./start-mcp-servers.sh
```

**Expected Output**:
```
═══════════════════════════════════════
  GEO-SEO MCP Servers - Docker Startup
═══════════════════════════════════════

✓ Docker is running

Starting all MCP servers...
Creating network "geo-seo-mcp-network"
Creating geo-seo-puppeteer-mcp  ... done
Creating geo-seo-playwright-mcp ... done

✓ MCP Servers Started
```

---

### Step 2: Update Claude Code Config (30 seconds)

```powershell
# Windows PowerShell
cd d:\GEO_SEO_Domination-Tool
copy .claude\mcp-docker.json .claude\mcp.json

# Git Bash/Linux/macOS
cd /d/GEO_SEO_Domination-Tool
cp .claude/mcp-docker.json .claude/mcp.json
```

Edit `.claude/settings.local.json` and add to the `enabledMcpjsonServers` array:
```json
{
  "enabledMcpjsonServers": [
    "shadcn-ui",
    "shadcn",
    "supabase",
    "perplexity",
    "github",
    "google-maps",
    "filesystem",
    "puppeteer-docker",
    "playwright-docker"
  ]
}
```

---

### Step 3: Reload VS Code (10 seconds)

1. Press `Ctrl+Shift+P`
2. Type "Reload Window"
3. Press Enter

---

## ✨ Test It Works

### Quick Test
Ask Claude Code in this terminal:
```
"Take a screenshot of https://example.com using the Docker Puppeteer MCP"
```

### Manual Test
```bash
# Test Puppeteer container
docker exec -i geo-seo-puppeteer-mcp node /app/mcp-wrapper.js

# Test Playwright container
docker exec -i geo-seo-playwright-mcp node /app/mcp-wrapper.js
```

---

## 📊 Verify Containers Running

```bash
docker-compose ps
```

**Expected**:
```
NAME                       STATUS
geo-seo-puppeteer-mcp      Up (healthy)
geo-seo-playwright-mcp     Up (healthy)
```

---

## 🎯 What You Can Do Now

### With Puppeteer MCP:
- ✅ Take screenshots of any URL
- ✅ Scrape website content
- ✅ Test forms and interactions
- ✅ Monitor page performance
- ✅ Capture console errors

### With Playwright MCP:
- ✅ Multi-browser testing (Chrome, Firefox, Safari)
- ✅ Mobile emulation
- ✅ Network request monitoring
- ✅ PDF generation
- ✅ Video recording
- ✅ Accessibility testing

---

## 🛠️ Daily Usage

### Start Servers
```bash
cd docker/mcp-servers
docker-compose up -d
```

### Stop Servers
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f
```

### Restart After Changes
```bash
docker-compose restart
```

---

## 🐛 Troubleshooting

### Issue: "Docker command not found"
**Fix**: Install Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)

---

### Issue: "Cannot connect to Docker daemon"
**Fix**: Start Docker Desktop application

---

### Issue: "Port already in use"
**Fix**: Edit `docker-compose.yml` and change ports:
```yaml
ports:
  - "3102:3100"  # Changed from 3100
```

---

### Issue: "Container exited with code 1"
**Fix**: Check logs
```bash
docker-compose logs puppeteer-mcp
```

Rebuild if needed:
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

### Issue: Claude Code can't see MCP tools
**Fix**: Verify configuration
```bash
# 1. Check containers running
docker-compose ps

# 2. Check MCP config
cat .claude/mcp.json | grep "puppeteer-docker" -A 5

# 3. Check enabled servers
cat .claude/settings.local.json | grep "puppeteer-docker"

# 4. Reload VS Code
# Ctrl+Shift+P -> Reload Window
```

---

## 📈 Resource Usage

**Typical Resource Usage**:
- Puppeteer: ~300MB RAM, ~15% CPU (idle)
- Playwright: ~500MB RAM, ~20% CPU (idle)

**When running browser**:
- Puppeteer: ~800MB RAM, ~50% CPU
- Playwright: ~1.2GB RAM, ~60% CPU

**Adjust if needed** in `docker-compose.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 4G
      cpus: '2'
```

---

## 🎓 Examples

### Example 1: Screenshot for SEO Audit
```
"Use Puppeteer to take a full-page screenshot of https://competitor.com
and save it to logs/screenshots/competitor-homepage.png"
```

### Example 2: Mobile Testing
```
"Use Playwright to test https://mysite.com on iPhone 12 viewport
and check if the navigation menu works"
```

### Example 3: Performance Check
```
"Navigate to https://mysite.com with Puppeteer and capture
all network requests to identify slow resources"
```

### Example 4: Form Testing
```
"Use Playwright to fill out the contact form at https://mysite.com/contact
with test data and verify submission works"
```

---

## 📁 File Locations

**Docker Files**:
```
docker/mcp-servers/
├── Dockerfile.puppeteer
├── Dockerfile.playwright
├── docker-compose.yml
├── mcp-wrapper.js
├── start-mcp-servers.sh
├── start-mcp-servers.ps1
└── README.md
```

**Configuration**:
```
.claude/
├── mcp.json                  # Active config (use mcp-docker.json)
├── mcp-docker.json           # Docker MCP config
└── settings.local.json       # Enabled servers
```

**Logs & Screenshots**:
```
logs/
├── screenshots/              # Browser screenshots
└── mcp-errors/              # Error logs
```

---

## 🔗 Related Guides

- Full Documentation: [docker/mcp-servers/README.md](docker/mcp-servers/README.md)
- MCP Reference: [MCP_SERVERS_REFERENCE.md](MCP_SERVERS_REFERENCE.md)
- Vercel CLI Scripts: [VERCEL_CLI_QUICK_REFERENCE.md](VERCEL_CLI_QUICK_REFERENCE.md)

---

## 🆘 Get Help

**Check Status**:
```bash
docker-compose ps
docker-compose logs --tail=50
```

**Reset Everything**:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Access Container Shell**:
```bash
docker exec -it geo-seo-puppeteer-mcp bash
```

---

## ✅ Success Checklist

After setup, verify:
- [ ] Docker Desktop is running
- [ ] Containers show "Up (healthy)" status
- [ ] `.claude/mcp.json` has docker configurations
- [ ] `puppeteer-docker` and `playwright-docker` in enabled servers
- [ ] VS Code reloaded
- [ ] Can ask Claude to take screenshots
- [ ] MCP tools visible when you ask "/mcp"

---

**Setup Time**: ~5 minutes
**Works On**: Windows, macOS, Linux
**Requires**: Docker Desktop (free)

**Ready to automate!** 🚀
