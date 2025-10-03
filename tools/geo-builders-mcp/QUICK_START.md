# Quick Start - GEO Builders MCP Server v0.2.0

## Installation

```bash
cd tools/geo-builders-mcp
npm install --no-optional
npm run build
```

## Claude Desktop Configuration

### Windows

Edit `%AppData%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "geo-builders": {
      "command": "node",
      "args": [
        "D:\\GEO_SEO_Domination-Tool\\geo-seo-domination-tool\\tools\\geo-builders-mcp\\dist\\index.js"
      ]
    }
  }
}
```

### macOS/Linux

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "geo-builders": {
      "command": "node",
      "args": [
        "/path/to/geo-seo-domination-tool/tools/geo-builders-mcp/dist/index.js"
      ]
    }
  }
}
```

**Important**:
- Use **absolute path** to `dist/index.js`
- Windows: Use double backslashes (`\\`)
- Replace the path with your actual workspace location

## Restart Claude Desktop

Fully quit Claude Desktop and restart it (don't just close the window).

## Test in Claude Desktop

### Test 1: List Builders

```
List all available builders
```

Expected: Shows 3 builders (nextjs-api-route, database-schema, mcp-tool)

### Test 2: Inspect Builder

```
Inspect the nextjs-api-route builder
```

Expected: Shows manifest with variables, templates, and tags

### Test 3: Apply Builder (Dry Run Example)

```
Apply the nextjs-api-route builder with:
- routeName: companies
- resourceName: Company
- hasAuth: true
- methods: ["GET", "POST"]
- strategy: safe-merge
```

Expected:
- Creates Git snapshot
- Generates file in web-app/app/api/companies/route.ts
- Returns snapshot ref and patch

## Available Tools

1. **list_builders** - List all available builders
2. **inspect_builder** - Show builder manifest details
3. **apply_builder** - Apply builder with Git snapshot
4. **preview_apply** - Preview changes (stub)

## Conflict Strategies

- `safe-merge` (default): Creates .patch files, doesn't overwrite
- `overwrite`: Replaces existing files
- `fail-on-conflict`: Stops on first conflict

## Rollback

If you need to undo changes:

```bash
# Use the gitSnapshotRef from apply_builder output
git reset --hard <gitSnapshotRef>
```

## Troubleshooting

### Tools don't appear

1. Check config file syntax (use JSONLint.com)
2. Verify absolute path is correct
3. Restart Claude Desktop completely
4. Check logs: `%AppData%\Claude\Logs\mcp*.log` (Windows)

### Build errors

```bash
npm run fix:build
```

## Next Steps

See `FEATURE_APPLY_BUILDER_SUMMARY.md` for detailed documentation.
