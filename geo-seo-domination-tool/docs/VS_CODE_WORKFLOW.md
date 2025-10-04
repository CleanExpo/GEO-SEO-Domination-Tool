# VS Code + Windows Workflow (Claude + MCP + CRM)

## 1) Open the repo in VS Code
- VS Code suggests recommended extensions; accept them.

## 2) Start everything
- **Run and Debug → _Run All: Web + MCP + Worker_** (or use **Terminal → Run Task**):
  - Web launches `web-app` on http://localhost:3000
  - MCP server runs on stdio (for Claude Desktop)
  - Redis worker processes jobs if `REDIS_URL` is set

## 3) Quick tasks
- **Open CRM** → opens `/projects/builds`
- **Docker: compose up -d / down**
- **MCP: list_builders** → sanity check
- **MCP: preview nextjs-api-route (health)** → dry-run a route
- **Release: trigger auto merge** → kicks the staged-release workflow

## 4) Claude Desktop
Add to `%AppData%\Claude\claude_desktop_config.json` if not already:
```json
{
  "mcpServers": {
    "geo-builders": { "command": "node", "args": ["TOOLS_PATH/geo-builders-mcp/dist/index.js"] }
  }
}
```

## 5) Tips
- If PowerShell profiles produce "Access is denied", start tasks from a new **Terminal → PowerShell** tab (VS Code uses `-NoProfile`).
- Windows line endings are normalized by Prettier; CI enforces LF.
