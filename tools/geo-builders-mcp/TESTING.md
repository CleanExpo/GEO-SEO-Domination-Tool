# Testing MCP Server Without Claude Desktop

## Overview

You can now test MCP tools directly from the command line without needing Claude Desktop. This is useful for:
- Quick testing during development
- CI/CD integration
- Debugging builder manifests
- Verifying tool responses

## Available Test Scripts

### npm run call:list

Lists all available builders.

```bash
npm run call:list
```

**Expected Output**:
```json
{
  "id": "1234567890",
  "ok": true,
  "result": {
    "builders": [
      {
        "id": "nextjs-api-route",
        "version": "1.0.0",
        "title": "Next.js API Route",
        "summary": "Generate a Next.js 15 App Router API route",
        "tags": ["nextjs", "api", "typescript"]
      }
    ]
  }
}
```

### npm run call:inspect

Inspects the `nextjs-api-route` builder manifest.

```bash
npm run call:inspect
```

**Expected Output**:
```json
{
  "id": "1234567890",
  "ok": true,
  "result": {
    "id": "nextjs-api-route",
    "version": "1.0.0",
    "title": "Next.js API Route",
    "variables": [...],
    "templates": [...]
  }
}
```

### npm run call:preview:health

Previews applying the health check route builder (stub - not yet implemented).

```bash
npm run call:preview:health
```

**Expected Output**:
```json
{
  "id": "1234567890",
  "ok": true,
  "result": {
    "message": "preview_apply not yet implemented - use apply_builder with dryRun parameter",
    "suggestion": "This tool will be implemented in a future update"
  }
}
```

### npm run call:apply:health

Applies the health check route builder with safe-merge strategy.

```bash
npm run call:apply:health
```

**Expected Output**:
```json
{
  "id": "1234567890",
  "ok": true,
  "result": {
    "gitSnapshotRef": "a1b2c3d4...",
    "patch": "diff --git a/...",
    "applied": ["web-app/app/api/health/route.ts"],
    "skipped": [],
    "conflicts": [],
    "warnings": []
  }
}
```

## Custom Tool Calls

You can call any tool with custom parameters using the `call-mcp.mjs` script:

### Basic Syntax

```bash
node scripts/call-mcp.mjs <tool_name> '<json_params>'
```

### Examples

#### List builders with tag filter (future feature)

```bash
node scripts/call-mcp.mjs list_builders '{"tags":["nextjs"]}'
```

#### Inspect specific builder

```bash
node scripts/call-mcp.mjs inspect_builder '{"id":"database-schema"}'
```

#### Apply builder with custom variables

```bash
node scripts/call-mcp.mjs apply_builder '{
  "id": "nextjs-api-route",
  "strategy": "safe-merge",
  "engine": "eta",
  "variables": {
    "ROUTE_NAME": "users",
    "ZOD_SCHEMA": "z.object({ name: z.string(), email: z.string().email() })"
  }
}'
```

#### Apply with overwrite strategy

```bash
node scripts/call-mcp.mjs apply_builder '{
  "id": "database-schema",
  "strategy": "overwrite",
  "variables": {
    "schemaName": "users",
    "tableName": "users"
  }
}'
```

## Error Handling

The call-mcp.mjs script:
- Returns exit code 0 on success
- Returns exit code 1 on failure
- Prints stderr to console
- Extracts JSON response from stdout

### Example Error

```bash
npm run call:inspect
# Output:
# {"id":"123","ok":false,"error":{"message":"manifest not found for nextjs-api-route"}}
# Exit code: 1
```

## PowerShell Compatibility

All npm scripts are PowerShell-friendly with properly escaped JSON:

```powershell
# Windows PowerShell
npm run call:list
npm run call:inspect
npm run call:apply:health
```

## Integration with CI/CD

You can use these scripts in GitHub Actions or other CI systems:

```yaml
# .github/workflows/test-mcp.yml
name: Test MCP Server
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd tools/geo-builders-mcp && npm install
      - run: cd tools/geo-builders-mcp && npm run build
      - run: cd tools/geo-builders-mcp && npm run call:list
```

## Debugging Tips

### View raw server output

```bash
node dist/index.js
# Then type JSON and press Enter:
{"id":"1","tool":"list_builders","params":{}}
```

### Check if build is up to date

```bash
npm run build
npm run call:list
```

### Test with verbose output

```bash
DEBUG=1 node scripts/call-mcp.mjs list_builders {}
```

## Troubleshooting

### "Cannot find module"

Make sure you've built the project:
```bash
npm run build
```

### "manifest not found"

The builder doesn't exist in the `../../builders/` directory. Check:
```bash
ls ../../builders/
```

### JSON parsing errors

Make sure to properly escape quotes in your JSON:
- Windows: Use `\"` for nested quotes
- Unix: Use `'{"key":"value"}'` with single quotes around the JSON

### Server doesn't start

Check that Node.js can find the built files:
```bash
ls dist/index.js
node --version  # Should be v18+
```

## Next Steps

Once you've verified tools work via CLI, configure Claude Desktop:
- See `QUICK_START.md` for Claude Desktop setup
- See `FEATURE_APPLY_BUILDER_SUMMARY.md` for full documentation
