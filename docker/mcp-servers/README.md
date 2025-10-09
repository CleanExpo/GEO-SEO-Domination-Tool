# Docker-Based MCP Servers

Run browser automation MCP servers (Puppeteer & Playwright) in Docker containers for reliable, isolated execution.

---

## 🎯 Why Docker for MCP?

### Problems with Native MCP Servers
❌ NPM package version conflicts
❌ Missing system dependencies (Chromium, etc.)
❌ Platform-specific issues (Windows vs Linux)
❌ Difficult to debug

### Benefits of Docker MCP Servers
✅ **Consistent Environment** - Same setup on any machine
✅ **Isolated Dependencies** - No conflicts with host system
✅ **Easy Management** - Start/stop/restart with one command
✅ **Pre-configured Browsers** - Chromium, Firefox, WebKit included
✅ **Better Debugging** - Access logs and shell easily
✅ **Resource Control** - Limit CPU/memory usage

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- At least 4GB RAM available for containers
- Windows, macOS, or Linux

### 1. Start MCP Servers

**Windows (PowerShell)**:
```powershell
cd docker/mcp-servers
.\start-mcp-servers.ps1 -Service all
```

**macOS/Linux (Bash)**:
```bash
cd docker/mcp-servers
chmod +x start-mcp-servers.sh
./start-mcp-servers.sh all
```

### 2. Verify Containers Are Running

```bash
docker-compose ps
```

Expected output:
```
NAME                       STATUS    PORTS
geo-seo-puppeteer-mcp      Up        0.0.0.0:3100->3100/tcp
geo-seo-playwright-mcp     Up        0.0.0.0:3101->3101/tcp
```

### 3. Update Claude Code Configuration

```bash
# Backup current config
cp .claude/mcp.json .claude/mcp.json.backup

# Use Docker config
cp .claude/mcp-docker.json .claude/mcp.json
```

### 4. Update Enabled Servers

Edit `.claude/settings.local.json`:
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

### 5. Reload VS Code

`Ctrl+Shift+P` → "Developer: Reload Window"

---

## 📦 Services Included

### 1. Puppeteer MCP (`puppeteer-docker`)

**Container**: `geo-seo-puppeteer-mcp`
**Port**: 3100
**Browser**: Chromium

**Capabilities**:
- Navigate to URLs
- Take screenshots
- Execute JavaScript
- Fill forms
- Click elements
- Extract content

**Use Cases**:
- Website screenshots for SEO audits
- Automated testing
- Content scraping
- Performance monitoring

---

### 2. Playwright MCP (`playwright-docker`)

**Container**: `geo-seo-playwright-mcp`
**Port**: 3101
**Browsers**: Chromium, Firefox, WebKit

**Capabilities**:
- Multi-browser testing
- Mobile emulation
- Network interception
- PDF generation
- Video recording
- Accessibility testing

**Use Cases**:
- Cross-browser compatibility testing
- Mobile-first SEO analysis
- Advanced automation workflows
- Visual regression testing

---

## 🔧 Configuration Files

### docker-compose.yml
Defines both MCP server services with:
- Health checks
- Resource limits
- Volume mounts
- Network configuration

### Dockerfile.puppeteer
Builds Puppeteer container with:
- Node.js 20
- Chromium browser
- MCP server package
- Stdio wrapper

### Dockerfile.playwright
Builds Playwright container with:
- Microsoft Playwright base image
- All browsers (Chromium, Firefox, WebKit)
- MCP server package
- Stdio wrapper

### mcp-wrapper.js
Bridges Docker stdio to MCP protocol:
- Receives commands from Claude Code via stdin
- Forwards to MCP server
- Returns results via stdout

---

## 🛠️ Management Commands

### Start Services
```bash
# All servers
docker-compose up -d

# Puppeteer only
docker-compose up -d puppeteer-mcp

# Playwright only
docker-compose up -d playwright-mcp
```

### Stop Services
```bash
# Stop all
docker-compose down

# Stop but keep containers
docker-compose stop

# Stop specific service
docker-compose stop puppeteer-mcp
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f puppeteer-mcp

# Last 50 lines
docker-compose logs --tail=50
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart playwright-mcp
```

### Check Status
```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Health status
docker inspect geo-seo-puppeteer-mcp | grep Health -A 10
```

---

## 🧪 Testing MCP Servers

### Test Puppeteer
```bash
# Execute wrapper directly
docker exec -i geo-seo-puppeteer-mcp node /app/mcp-wrapper.js

# Run browser test
docker exec geo-seo-puppeteer-mcp npx @modelcontextprotocol/server-puppeteer --version
```

### Test Playwright
```bash
# Check browsers
docker exec geo-seo-playwright-mcp npx playwright --version

# List installed browsers
docker exec geo-seo-playwright-mcp npx playwright install --dry-run
```

### Test Screenshots
```bash
# Navigate to container
docker exec -it geo-seo-puppeteer-mcp bash

# Inside container, create test script
cat > test.js << 'EOF'
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.screenshot({ path: '/app/screenshots/test.png' });
  await browser.close();
  console.log('Screenshot saved!');
})();
EOF

# Run test
node test.js
```

---

## 📊 Monitoring & Debugging

### View Container Logs in Real-Time
```bash
# Terminal 1: Puppeteer logs
docker logs -f geo-seo-puppeteer-mcp

# Terminal 2: Playwright logs
docker logs -f geo-seo-playwright-mcp
```

### Access Container Shell
```bash
# Puppeteer container
docker exec -it geo-seo-puppeteer-mcp bash

# Playwright container
docker exec -it geo-seo-playwright-mcp bash
```

### Inspect Container
```bash
# Full container details
docker inspect geo-seo-puppeteer-mcp

# Just health status
docker inspect geo-seo-puppeteer-mcp --format='{{json .State.Health}}'

# Resource limits
docker inspect geo-seo-puppeteer-mcp --format='{{json .HostConfig}}'
```

### Check Network
```bash
# List networks
docker network ls

# Inspect MCP network
docker network inspect geo-seo-mcp-network
```

---

## 🔒 Security Considerations

### Container Isolation
- Containers run with limited permissions
- No host filesystem access (except volumes)
- Network isolation via Docker network

### Resource Limits
```yaml
# In docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      memory: 1G
```

### Secure Configuration
- Don't commit API keys in Dockerfiles
- Use environment variables or secrets
- Regularly update base images

---

## 🐛 Troubleshooting

### Issue: Container won't start

**Check logs**:
```bash
docker-compose logs puppeteer-mcp
```

**Common causes**:
- Port already in use → Change port in docker-compose.yml
- Insufficient memory → Increase Docker Desktop memory limit
- Docker not running → Start Docker Desktop

---

### Issue: "Container not found" when using MCP

**Verify containers are running**:
```bash
docker-compose ps
```

**Restart containers**:
```bash
docker-compose restart
```

---

### Issue: Browser fails to launch

**Check browser installation**:
```bash
docker exec geo-seo-puppeteer-mcp chromium --version
docker exec geo-seo-playwright-mcp npx playwright --version
```

**Rebuild container**:
```bash
docker-compose build --no-cache puppeteer-mcp
docker-compose up -d puppeteer-mcp
```

---

### Issue: Permission denied

**Windows**: Run PowerShell as Administrator

**Linux/macOS**: Check file permissions
```bash
chmod +x start-mcp-servers.sh
sudo chmod 666 /var/run/docker.sock
```

---

### Issue: Claude Code can't connect

1. **Verify MCP config**:
   ```bash
   cat .claude/mcp.json | grep -A 5 "puppeteer-docker"
   ```

2. **Test Docker exec**:
   ```bash
   echo '{"test": "message"}' | docker exec -i geo-seo-puppeteer-mcp node /app/mcp-wrapper.js
   ```

3. **Check logs**:
   ```bash
   docker-compose logs --tail=50
   ```

4. **Reload VS Code**:
   `Ctrl+Shift+P` → "Developer: Reload Window"

---

## 🔄 Updates & Maintenance

### Update MCP Server Packages
```bash
# Rebuild containers with latest packages
docker-compose build --no-cache
docker-compose up -d
```

### Update Base Images
```bash
# Pull latest base images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build
```

### Clean Up Old Images
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## 📈 Performance Optimization

### Increase Shared Memory
```yaml
# In docker-compose.yml
shm_size: '2gb'  # Increase if browsers crash
```

### Add Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '4'      # More CPUs for parallel tests
      memory: 4G     # More memory for complex pages
```

### Enable BuildKit
```bash
# Faster builds
export DOCKER_BUILDKIT=1
docker-compose build
```

---

## 🎓 Advanced Usage

### Custom Browser Arguments
Edit Dockerfile to add Chromium flags:
```dockerfile
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage"
```

### Persistent Browser Data
Add volume for browser profiles:
```yaml
volumes:
  - browser-profiles:/root/.config/chromium
```

### Multi-Instance Setup
Run multiple containers on different ports:
```bash
docker-compose --project-name mcp-1 up -d
docker-compose --project-name mcp-2 -f docker-compose.yml up -d
```

---

## 📝 Files Overview

```
docker/mcp-servers/
├── Dockerfile.puppeteer         # Puppeteer container
├── Dockerfile.playwright        # Playwright container
├── docker-compose.yml           # Service orchestration
├── mcp-wrapper.js               # Stdio bridge
├── start-mcp-servers.sh         # Bash startup script
├── start-mcp-servers.ps1        # PowerShell startup script
├── .env.example                 # Environment template
└── README.md                    # This file

.claude/
├── mcp.json                     # Original MCP config
├── mcp-docker.json              # Docker MCP config
└── settings.local.json          # Enabled servers
```

---

## 🆘 Support & Resources

### Get Help
1. Check container logs: `docker-compose logs -f`
2. Review this README
3. Check Docker Desktop status
4. Verify .claude/mcp.json configuration

### Useful Links
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Puppeteer Docs](https://pptr.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

---

## 📄 License

MIT - Part of GEO-SEO Domination Tool

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
**Maintained By**: GEO-SEO Development Team
