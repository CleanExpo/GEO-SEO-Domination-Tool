# GEO Builders MCP Server

Model Context Protocol server that discovers, previews, and applies modular builders into the GEO-SEO Domination Tool project.

## Features

- **Builder Discovery**: Automatically discover builders from the `./builders` directory
- **Type-Safe**: Full TypeScript implementation with strict typing
- **Flexible**: Support for Eta and Handlebars template engines
- **Next.js First**: Optimized for Next.js 15 App Router patterns
- **Database Aware**: Works with SQLite/PostgreSQL + Supabase architecture

## Installation

```bash
cd tools/geo-builders-mcp
npm install --no-optional  # Skip optional deps to avoid Windows build issues
npm run build              # Pure TypeScript compilation (tsc)
```

**Troubleshooting Installation on Windows:**

If you encounter build errors related to optional dependencies (esbuild, rollup, etc.), use the automated fix script:

```powershell
npm run fix:build
```

This will:
- Clean node_modules and lockfile
- Reinstall with `--no-optional`
- Build with pure TypeScript (no bundler)

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

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

Restart Claude Desktop and the tools will be available.

## Available Tools

### `list_builders`

List all available builders from the registry.

**Parameters:**
- `source` (optional): Source to list from (default: "local")
- `tags` (optional): Filter by tags (array of strings)

**Example:**
```
List all available builders
```

### `inspect_builder`

Show detailed manifest information for a specific builder.

**Parameters:**
- `id` (required): Builder ID to inspect

**Example:**
```
Inspect the nextjs-api-route builder
```

## Available Builders

### nextjs-api-route

Generate a Next.js 15 App Router API route with TypeScript, Zod validation, and service layer pattern.

**Variables:**
- `routeName` (required): Name of the API route (plural, lowercase)
- `resourceName` (required): Name of the resource (singular, PascalCase)
- `hasAuth` (optional): Include authentication middleware (default: true)
- `methods` (optional): HTTP methods to implement (default: ["GET", "POST"])

**Example:**
```json
{
  "routeName": "products",
  "resourceName": "Product",
  "hasAuth": true,
  "methods": ["GET", "POST", "PUT", "DELETE"]
}
```

### database-schema

Generate a modular SQL schema file following the project's pattern (SQLite/PostgreSQL compatible).

**Variables:**
- `schemaName` (required): Name of the schema file (kebab-case)
- `tableName` (required): Primary table name (plural, snake_case)
- `description` (optional): Schema description

**Example:**
```json
{
  "schemaName": "content-library",
  "tableName": "articles",
  "description": "Content library for SEO articles and resources"
}
```

### mcp-tool

Generate a new MCP tool implementation for the geo-builders-mcp server (meta!).

**Variables:**
- `toolName` (required): Name of the MCP tool (snake_case)
- `toolDescription` (required): Description of what the tool does
- `functionName` (required): Function name (camelCase)

**Example:**
```json
{
  "toolName": "preview_apply",
  "toolDescription": "Dry-run an application of a builder and return a readable diff plan",
  "functionName": "previewApply"
}
```

## Development

```bash
# Run in development mode
npm run dev

# Build for production (pure TypeScript, no bundler)
npm run build

# Type check
npm run typecheck

# Lint
npm run lint

# Fix build issues (Windows)
npm run fix:build
```

**Build System:**
- Uses pure TypeScript compiler (`tsc`) instead of bundlers
- Avoids optional dependency issues on Windows
- Outputs ESM modules to `dist/`
- Generates `.d.ts` declaration files

## Architecture

```
tools/geo-builders-mcp/
├── src/
│   ├── index.ts           # Main server entry point
│   ├── registry.ts        # Builder discovery and management
│   ├── types.ts           # TypeScript type definitions
│   └── tools/
│       ├── list-builders.ts    # List available builders
│       └── inspect-builder.ts  # Inspect builder details
├── dist/                  # Compiled JavaScript (generated)
└── package.json

builders/
├── nextjs-api-route/
│   ├── manifest.json
│   └── templates/
│       └── route.ts.eta
├── database-schema/
│   ├── manifest.json
│   └── templates/
│       └── schema.sql.eta
└── mcp-tool/
    ├── manifest.json
    └── templates/
        └── tool.ts.eta
```

## Creating New Builders

1. Create a directory in `builders/` with your builder ID
2. Create a `manifest.json` (or `manifest.yaml`) following the schema
3. Create templates in the `templates/` subdirectory
4. Use Eta syntax: `<%= it.variableName %>` for variable substitution

**Manifest Schema:**
```json
{
  "id": "my-builder",
  "version": "1.0.0",
  "title": "My Builder",
  "summary": "Short description",
  "tags": ["tag1", "tag2"],
  "targetPaths": ["web-app/app/"],
  "variables": [
    {
      "name": "variableName",
      "required": true,
      "example": "exampleValue",
      "description": "What this variable is for"
    }
  ],
  "templates": [
    {
      "from": "template.ts.eta",
      "to": "web-app/app/<%= it.variableName %>/file.ts",
      "engine": "eta"
    }
  ]
}
```

## Roadmap

Future tools to implement:

- `preview_apply`: Dry-run builder application with diff preview
- `apply_builder`: Actually apply a builder to the repository
- `post_install_check`: Run TypeScript/lint/build checks after applying

## License

MIT

---

**Created**: 2025-01-03
**Branch**: feature/mcp-server-core
**Status**: Core implementation complete (list_builders, inspect_builder)
