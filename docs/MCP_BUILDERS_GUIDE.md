# GEO Builders MCP Server - Integration Guide

## Overview

The GEO Builders MCP Server is a Model Context Protocol server that enables Claude to discover, preview, and apply modular code templates (called "builders") to the GEO-SEO Domination Tool project.

Think of it as a **smart code scaffolding system** that understands your project's patterns and can generate boilerplate code following established conventions.

## What Are Builders?

Builders are self-contained code templates that:
- Follow project conventions (Next.js 15 App Router, TypeScript, service layer pattern)
- Support variable substitution (names, types, options)
- Include validation schemas and conflict detection
- Can be discovered and applied through Claude

## Why Use This?

Instead of:
```
Claude: "I'll create a new API route for you..."
*Manually creates route.ts with potential inconsistencies*
```

With MCP Builders:
```
You: "Create a products API route"
Claude: *Uses inspect_builder to see the template*
Claude: *Generates code following exact project patterns*
Result: Consistent, validated, production-ready code
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd tools/geo-builders-mcp
npm install --no-optional  # Skip optional deps to avoid Windows build issues
npm run build              # Pure TypeScript compilation (tsc)
```

**Windows Users**: If you encounter errors with optional dependencies (esbuild, rollup), use:

```powershell
npm run fix:build
```

This automated script will clean, reinstall without optional deps, and build with pure TypeScript.

### 2. Configure Claude Desktop

**macOS/Linux:**
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:**
Edit `%AppData%\Claude\claude_desktop_config.json`

Add the MCP server:

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

**Important**: Use the absolute path to `dist/index.js`. Adjust the path for your system.

### 3. Restart Claude Desktop

After saving the config, fully quit and restart Claude Desktop.

### 4. Verify Installation

In Claude Desktop, look for the tool icon. Ask:
```
List all available builders
```

You should see the three initial builders:
- `nextjs-api-route`
- `database-schema`
- `mcp-tool`

## Using Builders

### Example 1: Create a Next.js API Route

**Conversation:**
```
You: Create a new API route for managing blog posts

Claude: Let me inspect the nextjs-api-route builder first.
*Uses inspect_builder tool*

Claude: I'll create a blog posts API route with:
- GET /api/posts - List all posts
- POST /api/posts - Create new post
- PUT /api/posts - Update post
- DELETE /api/posts - Delete post

*Would show the generated code based on template*
```

The builder ensures:
✅ TypeScript strict mode compliance
✅ Zod validation schema
✅ Error handling patterns
✅ Authentication hooks (if enabled)
✅ Consistent API response format

### Example 2: Create a Database Schema

**Conversation:**
```
You: I need a database schema for storing SEO keywords

Claude: *Uses inspect_builder for database-schema*
Claude: I'll create a keywords schema with:
- keywords table
- Indexes for common queries
- Updated_at trigger
- Foreign key relationships

*Generates schema following project pattern*
```

The builder ensures:
✅ SQLite/PostgreSQL compatibility
✅ Proper indexes
✅ Timestamp triggers
✅ Follows existing schema patterns

### Example 3: Create a New MCP Tool (Meta!)

**Conversation:**
```
You: Add a preview_apply tool to the MCP server

Claude: *Uses inspect_builder for mcp-tool*
Claude: I'll create the tool implementation with:
- TypeScript types for params/output
- Registry integration
- Error handling

*Generates tool.ts file*
Claude: Remember to register it in src/index.ts!
```

## Builder Manifest Structure

Each builder has a `manifest.json` that defines:

```json
{
  "id": "my-builder",           // Unique identifier (kebab-case)
  "version": "1.0.0",            // Semantic version
  "title": "Human Title",        // Display name
  "summary": "What it does",     // Short description
  "tags": ["nextjs", "api"],     // Searchable tags
  "targetPaths": ["web-app/"],   // Where files will be created

  "variables": [                 // User-provided inputs
    {
      "name": "resourceName",
      "required": true,
      "example": "Product",
      "description": "Name of the resource"
    }
  ],

  "templates": [                 // Template files to process
    {
      "from": "route.ts.eta",
      "to": "web-app/app/api/<%= it.routeName %>/route.ts",
      "engine": "eta"
    }
  ],

  "conflicts": [                 // Prevent overwrites
    {
      "glob": "web-app/app/api/**/route.ts",
      "strategy": "fail"
    }
  ],

  "hooks": {                     // Pre/post commands
    "post": ["echo 'Done!'"]
  },

  "validators": ["typescript"],  // Validation checks
  "licenses": [{ "name": "MIT" }]
}
```

## Template Syntax (Eta)

Builders use [Eta](https://eta.js.org/) template engine by default:

### Variable Substitution
```typescript
// Template
const <%= it.resourceName %>Schema = z.object({
  // ...
});

// With variables: { resourceName: "Product" }
// Output
const ProductSchema = z.object({
  // ...
});
```

### Conditionals
```typescript
<% if (it.hasAuth) { %>
  // Authentication check
  const session = await getSession(request);
<% } %>
```

### Loops
```typescript
<% it.methods.forEach(method => { %>
  export async function <%= method %>(request: NextRequest) {
    // ...
  }
<% }) %>
```

## Available MCP Tools

### `list_builders`

**Purpose**: Discover all available builders

**Parameters**:
- `source` (optional): "local" (default)
- `tags` (optional): Filter by tags like ["nextjs", "api"]

**Example Use**:
```
List all builders tagged with 'database'
```

**Output**:
```json
{
  "builders": [
    {
      "id": "database-schema",
      "version": "1.0.0",
      "title": "Database Schema",
      "summary": "Generate a modular SQL schema file...",
      "tags": ["database", "sql", "schema"]
    }
  ]
}
```

### `inspect_builder`

**Purpose**: Get full details about a specific builder

**Parameters**:
- `id` (required): Builder ID (e.g., "nextjs-api-route")

**Example Use**:
```
Inspect the nextjs-api-route builder
```

**Output**: Complete manifest with variables, templates, conflicts, etc.

## Creating Your Own Builder

### Step 1: Create Directory Structure

```bash
mkdir -p builders/my-feature/templates
```

### Step 2: Create Manifest

`builders/my-feature/manifest.json`:

```json
{
  "id": "my-feature",
  "version": "1.0.0",
  "title": "My Feature",
  "summary": "Generate my custom feature",
  "tags": ["custom"],
  "targetPaths": ["web-app/app/"],
  "variables": [
    {
      "name": "featureName",
      "required": true,
      "example": "Dashboard",
      "description": "Name of the feature"
    }
  ],
  "templates": [
    {
      "from": "component.tsx.eta",
      "to": "web-app/app/<%= it.featureName.toLowerCase() %>/page.tsx",
      "engine": "eta"
    }
  ]
}
```

### Step 3: Create Template

`builders/my-feature/templates/component.tsx.eta`:

```tsx
/**
 * <%= it.featureName %> Page
 * Generated by geo-builders-mcp
 */

'use client';

export default function <%= it.featureName %>Page() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">
        <%= it.featureName %>
      </h1>
      <p className="mt-4">
        Your <%= it.featureName.toLowerCase() %> feature goes here.
      </p>
    </div>
  );
}
```

### Step 4: Test

```
Claude: List all available builders
*Should show "my-feature" in the list*

Claude: Inspect the my-feature builder
*Shows manifest details*
```

## Troubleshooting

### Builder Not Appearing

**Check:**
1. Builder directory exists in `builders/`
2. `manifest.json` is valid JSON
3. Manifest follows the schema (required fields present)
4. MCP server was restarted after adding builder

**Debug:**
```bash
cd tools/geo-builders-mcp
npm run dev
# Check console for errors
```

### Template Not Rendering

**Check:**
1. Template file exists in `templates/` subdirectory
2. Template path in manifest matches actual file
3. Eta syntax is correct (use `<%= %>` not `{{ }}`)
4. Variable names match between manifest and template

### Claude Desktop Not Detecting Tools

**Check:**
1. `claude_desktop_config.json` syntax is valid
2. Absolute path to `dist/index.js` is correct
3. Server was built: `npm run build`
4. Claude Desktop was fully restarted (quit completely)

**View logs:**
- macOS: `~/Library/Logs/Claude/mcp*.log`
- Windows: `%AppData%\Claude\Logs\mcp*.log`

## Best Practices

### 1. Naming Conventions

- **Builder IDs**: `kebab-case` (e.g., `nextjs-api-route`)
- **Variable names**: `camelCase` (e.g., `resourceName`)
- **File paths**: Match project structure
- **Tags**: Lowercase, singular (e.g., `["nextjs", "api", "typescript"]`)

### 2. Template Design

- Include helpful TODO comments
- Follow project's existing patterns
- Provide sensible defaults
- Include error handling
- Add TypeScript types

### 3. Documentation

- Clear variable descriptions with examples
- Document what the builder creates
- Explain any hooks or validators
- Include license information

### 4. Testing

- Test with various variable combinations
- Verify generated code compiles
- Check conflict detection works
- Ensure paths are correct on both Windows/macOS

## Integration with Project Workflow

### When to Use Builders

**Good Use Cases:**
- ✅ Creating new API routes following project pattern
- ✅ Generating database schemas with proper indexes
- ✅ Scaffolding new pages with consistent layout
- ✅ Adding new MCP tools to the server

**Not Ideal For:**
- ❌ One-off custom logic
- ❌ Complex multi-file features (use multiple builders)
- ❌ Modifying existing code (use Claude's editing directly)

### Combining with Other Tools

Builders work best with:

1. **Claude Code CLI**: Use builders to generate code, then review with Claude Code CLI's code-reviewer subagent
2. **SEMrush MCP**: Generate SEO analysis pages, then fetch real data
3. **GitHub MCP**: Create feature branches, apply builders, commit results
4. **Vercel MCP**: Deploy generated routes to preview

## Future Enhancements

Planned tools for future branches:

### `preview_apply`
- Dry-run builder application
- Show diff of changes
- Detect conflicts before applying
- Validate against write allowlist

### `apply_builder`
- Actually write files to disk
- Create git snapshots before changes
- Handle conflict resolution strategies
- Run post-apply hooks

### `post_install_check`
- Run TypeScript type checking
- Execute linter
- Run tests
- Build Next.js app
- Verify no errors introduced

## Related Documentation

- [MCP Server Building Guide](../docs/build-assistant-tools/mcp-server-guide.md)
- [Claude Code CLI Reference](../docs/build-assistant-tools/claude-code-cli.md)
- [Project Architecture (CLAUDE.md)](../CLAUDE.md)

---

**Created**: 2025-01-03
**Branch**: feature/mcp-server-core
**Status**: Core implementation complete
**Maintainer**: Development Team
