# CRM Builds Module

This module adds:

- **API**: `POST /api/builds` with `{ action, params }`
  - Allowed actions: `list_builders`, `inspect_builder`, `preview_apply`, `apply_builder`, `post_install_check`
- **Page**: `/projects/builds` basic UI to list/inspect/preview/apply

The API spawns the MCP server (`tools/geo-builders-mcp/dist/index.js`) per request and sends a single tool call over stdin.

## Security
- The API whitelists tool names.
- No secrets are accepted or returned.
- Write operations happen only through MCP and respect your repo allowlist.

## Notes
- In dev mode, relative path resolution assumes repo layout with `web-app/` and `tools/geo-builders-mcp/`.
- In production, you may prefer a persistent MCP process or job queue; this MVP keeps it simple.
