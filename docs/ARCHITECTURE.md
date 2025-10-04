# Architecture

**Flow**
CRM (Next.js) ⇄ API routes (/api/builds, /api/blueprints, /api/deploy, /api/integrations) ⇄ **MCP server** (stdio) ⇄ **Builders** (templates + manifests)

**Key components**
- **MCP server**: `tools/geo-builders-mcp/dist/index.js` (tools: list/inspect/preview/apply/post_install_check)
- **Builders**: `tools/geo-builders-mcp/builders/*`
- **CLI**: `geo` leverages CRM APIs + stdio MCP
- **Deploy**: local/SSH Docker Compose via `/api/deploy`
- **Release**: staged merge via GH Actions, branch protections, merge queue
- **Observability**: Release Monitor, Health endpoint
