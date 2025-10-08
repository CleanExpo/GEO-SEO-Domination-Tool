# 🚀 Unified AI Dev Workspace - Setup Guide

Complete guide to setting up the GEO-SEO Unified AI Development Workspace with global MCP servers, autonomous agents, CRM integration, and click-to-code functionality.

---

## 📋 Overview

This workspace provides:

- **Global MCP Servers**: Playwright, Filesystem, Git (shared across all projects)
- **Global Agent Registry**: 8 autonomous agents with swarm orchestration
- **LocalLift CRM Integration**: Automatic dev event tracking
- **Live Preview + Click-to-Code**: Ctrl+Shift+E to jump from browser to source
- **Git Workflow Automation**: Conventional commits, auto-tracking, hooks
- **Multi-Platform Integration**: GitHub, Vercel, Supabase

---

## 🛠️ Prerequisites

Before setup, ensure you have:

1. **Node.js** (v18+) and **npm** installed
2. **VS Code** with CLI installed (`code --version` should work)
3. **PowerShell** (v5.1+ or PowerShell Core 7+)
4. **Git** installed and configured
5. **Windows** (scripts are PowerShell-based; adapt for macOS/Linux)

---

## 📦 Step 1: Run Setup Script

The setup script creates all directories, configurations, and integrations.

### Run Setup

```powershell
# Navigate to project root
cd D:\GEO_SEO_Domination-Tool

# Run setup script
pwsh scripts/setup.ps1
```

### What It Does

✅ Creates global directory structure:
- `C:/AI/GlobalAgents/registry/` - Agent registry
- `C:/AI/MCP/` - Global MCP servers
- `C:/AI/.sandbox/` - Live preview sandbox
- `C:/AI/.logs/` - Dev logs
- `C:/AI/.artifacts/` - Build artifacts

✅ Configures MCP servers in `mcp-config.json`
✅ Creates agent registry at `C:/AI/GlobalAgents/registry/registry.json`
✅ Sets up VS Code tasks in `.vscode/tasks.json`
✅ Installs Git hooks (pre-commit, post-commit)
✅ Creates CRM integration config at `config/crm-integration.json`
✅ Creates environment template at `.env.workspace.template`

---

## 🔐 Step 2: Configure Environment Variables

Copy the environment template and add your API keys:

```powershell
# Copy template
cp .env.workspace.template .env.local
```

### Edit `.env.local`

Add your actual API keys:

```env
# LocalLift CRM API
LOCALLIFT_API_KEY=your_actual_api_key_here
LOCALLIFT_PROJECT_ID=geo-seo-domination-tool

# GitHub Integration
GITHUB_TOKEN=ghp_your_github_token_here

# Vercel Integration
VERCEL_TOKEN=your_vercel_token_here
VERCEL_PROJECT_ID=prj_your_vercel_project_id

# Supabase Integration (if using)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key

# Telemetry
TELEMETRY_ENABLED=true
TELEMETRY_ENDPOINT=https://api.locallift.io/v1/telemetry
```

**⚠️ Security**: Never commit `.env.local` to version control!

---

## 🤖 Step 3: Install Global MCP Servers

### 3.1 Install Playwright MCP

```powershell
# Install Playwright MCP (if not already installed)
npm install -g @modelcontextprotocol/server-playwright

# Create symlink at C:/AI/MCP/playwright-mcp.exe
# (Adjust path based on where npm global installs binaries)
mklink C:\AI\MCP\playwright-mcp.exe "C:\Users\YourUser\AppData\Roaming\npm\mcp-playwright.cmd"
```

### 3.2 Verify Filesystem & Git MCP Servers

These use `npx` and install on-demand. No manual installation needed.

**Test filesystem MCP**:
```powershell
npx -y @modelcontextprotocol/server-filesystem C:/AI/GlobalAgents --version
```

**Test git MCP**:
```powershell
npx -y @modelcontextprotocol/server-git --help
```

---

## 👁️ Step 4: Set Up Click-to-Code

### 4.1 Install Browser Extension

The `scripts/dev.ps1` script automatically generates a userscript at:
```
C:/AI/.sandbox/click-to-code.user.js
```

**Install in your browser**:

1. Install **Tampermonkey** (Chrome) or **Greasemonkey** (Firefox)
2. Open extension settings → Create New Script
3. Copy contents from `C:/AI/.sandbox/click-to-code.user.js`
4. Save script

### 4.2 Verify VS Code CLI

```powershell
# Test VS Code CLI
code --version
```

If not installed:
```powershell
# Install VS Code CLI from within VS Code
# Command Palette (Ctrl+Shift+P) → "Shell Command: Install 'code' command in PATH"
```

---

## 🎯 Step 5: Start Dev Workspace

### Method 1: PowerShell Script (Recommended)

```powershell
# Start unified dev workspace
pwsh scripts/dev.ps1
```

**Features**:
- ✅ Starts Next.js dev server on port 3000
- ✅ Sends session start event to CRM
- ✅ Opens browser automatically
- ✅ Enables click-to-code userscript
- ✅ Displays available agents and workflows

**Keyboard Controls**:
- `Q` - Quit workspace
- `R` - Restart dev server
- `B` - Open new browser window
- `T` - Open task inbox

### Method 2: VS Code Task

1. Open VS Code Command Palette (`Ctrl+Shift+P`)
2. Select: **Tasks: Run Task**
3. Choose: **Start Dev Workspace**

### Method 3: Manual (Traditional)

```bash
npm run dev
```

---

## 🧪 Step 6: Test Click-to-Code

1. **Open** http://localhost:3000 in browser
2. **Press** `Ctrl+Shift+E` to toggle inspector
3. **Hover** over any element (green border appears)
4. **Click** the element
5. **VS Code opens** the source file at the exact line!

### How It Works

1. Components have `data-source` attributes: `data-source="components/Sidebar.tsx:42:10"`
2. Userscript intercepts clicks and sends filepath to backend
3. Backend resolves path and executes: `code -g "D:/GEO_SEO_Domination-Tool/components/Sidebar.tsx:42:10"`
4. VS Code opens at the exact location

---

## 🤝 Step 7: Test CRM Integration

### Check CRM Endpoint Health

```powershell
curl http://localhost:3000/api/v1/dev-events
```

**Expected Response**:
```json
{
  "status": "operational",
  "crmIntegration": {
    "enabled": true,
    "baseUrl": "https://api.locallift.io",
    "projectId": "geo-seo-domination-tool",
    "authenticated": true,
    "enabledEvents": {
      "commit": true,
      "branch": true,
      "preview": true
    }
  }
}
```

### Send Test Event

```powershell
curl -X POST http://localhost:3000/api/v1/dev-events `
  -H "Content-Type: application/json" `
  -d '{
    "event": "dev.test.manual",
    "projectId": "geo-seo-domination-tool",
    "timestamp": "2025-10-08T12:00:00Z",
    "metadata": {
      "source": "manual-test"
    }
  }'
```

---

## 🤖 Step 8: Test Autonomous Agents

### List Available Agents

```powershell
# From Node.js environment
node -e "import('./services/global-agent-registry.js').then(m => m.listGlobalAgents())"
```

**Expected Output**:
```
🤖 Available Global Agents:

🟢 Orchestra Coordinator (orchestra-coordinator)
   Priority: 100 | Autonomy: 90%
   Tools: filesystem, git
   Capabilities: Multi-Agent Swarm Orchestration, Workflow Execution

🟡 Shadcn UI Generator (ui-shadcn-generator)
   Priority: 80 | Autonomy: 70%
   Tools: shadcn-ui, filesystem
   Capabilities: Component Scaffolding

...
```

### Execute Autonomous Task

1. **Open Task Inbox**: http://localhost:3000/task-inbox
2. **Create Task**:
   - Title: "Audit homepage for SEO issues"
   - Description: "Crawl homepage, check meta tags, generate report"
   - Workflow: `autonomous-seo-audit`
   - Priority: `high`
3. **Click "Create Task"** → Confirm execution
4. **Watch logs** in browser console

---

## 📊 Available Workflows

The workspace includes 4 pre-configured workflows:

### 1. New Project Scaffold
**Trigger**: Manual
**Agents**: site-builder-fullstack → navigation-links-syncer → ui-shadcn-generator
**Use Case**: Bootstrap complete Next.js project with database, auth, deployment

### 2. Catalog on Commit
**Trigger**: Git hook (`post-commit`)
**Agents**: ui-shadcn-generator
**Use Case**: Auto-update component catalog after every commit

### 3. Discover Content Opportunities
**Trigger**: Manual
**Agents**: reddit-agent → seo-agent → content-agent
**Use Case**: Mine Reddit for content gaps, generate article outlines

### 4. Autonomous SEO Audit
**Trigger**: Manual
**Agents**: browser-agent → seo-agent
**Use Case**: Crawl website, perform audit, generate actionable report

---

## 🔧 Troubleshooting

### Issue: MCP Servers Not Connecting

**Solution**:
1. Verify `mcp-config.json` paths are correct
2. Test MCP servers manually:
   ```powershell
   npx -y @modelcontextprotocol/server-filesystem C:/AI/GlobalAgents
   ```
3. Check Claude Code logs for MCP connection errors

### Issue: Click-to-Code Not Working

**Solution**:
1. Verify userscript is installed in Tampermonkey/Greasemonkey
2. Check browser console for errors (`F12`)
3. Test VS Code CLI: `code --version`
4. Test API endpoint: `curl http://localhost:3000/api/dev/open-in-vscode`

### Issue: CRM Events Not Forwarding

**Solution**:
1. Verify `LOCALLIFT_API_KEY` is set in `.env.local`
2. Check CRM config: `cat config/crm-integration.json`
3. Test endpoint health: `curl http://localhost:3000/api/v1/dev-events`
4. Check server logs for CRM forwarding errors

### Issue: Agent Registry Not Loading

**Solution**:
1. Verify registry file exists: `C:/AI/GlobalAgents/registry/registry.json`
2. Check file permissions
3. Run setup script again: `pwsh scripts/setup.ps1 -Force`

---

## 📚 Next Steps

Now that your workspace is set up:

1. **Create Your First Autonomous Task**
   - Open http://localhost:3000/task-inbox
   - Submit a task like "Find SEO issues on homepage"

2. **Test Content Opportunity Discovery**
   - Open http://localhost:3000/content-opportunities
   - Enter keyword: "water damage restoration Brisbane"
   - Discover Reddit content gaps

3. **Customize Agents**
   - Edit agent capabilities in `workspace-config.json`
   - Re-run `pwsh scripts/setup.ps1` to update registry

4. **Build Custom Workflows**
   - Add new workflows to `workspace-config.json`
   - Combine agents in novel ways

5. **Integrate with CI/CD**
   - Add Git hooks for automatic quality checks
   - Set up Vercel preview URL tracking to CRM

---

## 🎉 You're Ready!

Your Unified AI Dev Workspace is fully operational:

✅ Global MCP servers configured
✅ 8 autonomous agents registered
✅ CRM integration tracking dev events
✅ Click-to-code live preview enabled
✅ Git workflow automation ready
✅ Multi-platform integrations connected

**Start building with AI-powered automation!** 🚀

---

## 📞 Support

**Issues?** Open a GitHub issue or check troubleshooting section above.

**Documentation**:
- `workspace-config.json` - Main configuration file
- `scripts/setup.ps1` - Setup automation script
- `scripts/dev.ps1` - Dev workflow orchestrator
- `CLAUDE.md` - Project architecture guide

**Built with ❤️ by the GEO-SEO Team**
