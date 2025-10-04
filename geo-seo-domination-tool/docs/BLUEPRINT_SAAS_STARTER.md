# SaaS Starter Blueprint

**What it does**
- Combines multiple builders into turnkey SaaS foundation
- Two variants: basic (saas-starter) and with database (saas-starter-with-db)
- Chains existing builders with variable resolution
- Requires workspace and authentication

## Blueprints

### saas-starter.json

Minimal SaaS foundation with authentication, usage metering, and deployment tooling.

**Included Builders**:
1. `plan-caps` - Plan default caps with role-based limits
2. `usage-schema` - Usage tracking database schema
3. `usage-runtime` - Usage metering library and API
4. `supabase-setup` - Supabase client configuration
5. `nextjs-api-route` (health) - Health check endpoint
6. `github-actions-ci` - CI/CD pipeline
7. `docker-compose` - Container orchestration

**Use Case**: Quick start for SaaS projects needing auth and metering without custom database schema.

### saas-starter-with-db.json

Complete SaaS stack including database schema for projects.

**Included Builders**:
1. `database-schema` (projects table) - Custom database schema
2. `plan-caps` - Plan default caps
3. `usage-schema` - Usage tracking schema
4. `usage-runtime` - Usage metering library
5. `supabase-setup` - Supabase configuration
6. `nextjs-api-route` (health) - Health check endpoint
7. `github-actions-ci` - CI/CD pipeline
8. `docker-compose` - Container orchestration

**Use Case**: Full SaaS foundation with custom business entities (projects, workspaces, etc.).

## Features

### Multi-Step Execution

Blueprints execute builders sequentially:
1. Each step references a builder by ID
2. Variables are passed to the builder
3. Generated files accumulate across steps
4. Final result includes all files from all builders

### Variable Resolution

Variables can be:
- **Static**: Hardcoded in blueprint JSON (e.g., `ROUTE_NAME: "health"`)
- **Empty objects**: Use builder defaults (e.g., `plan-caps: {}`)
- **Dynamic**: Resolved from workspace context or user input

### Idempotent Application

Blueprints can be run multiple times:
- Existing files are overwritten with `.bak` backup
- Path allowlist prevents unintended writes
- Rollback available via `/api/rollback`

## Usage

### Via MCP Tool (preview_apply_blueprint)

```typescript
const result = await callMcp('preview_apply_blueprint', {
  blueprint: 'saas-starter'
});

// Result contains files from all builders
const files = result?.result?.files || [];
```

### Via API (/api/apply with blueprint)

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "blueprint": "saas-starter",
    "variables": {}
  }'
```

**Response**:
```json
{
  "ok": true,
  "result": {
    "wrote": 15,
    "results": [
      { "to": "database/plan_defaults.sql", "ok": true },
      { "to": "web-app/lib/plans.ts", "ok": true },
      { "to": "web-app/app/api/health/route.ts", "ok": true }
      // ... more files
    ]
  }
}
```

### Via Jobs Queue

Enqueue blueprint application as background job:

```typescript
await fetch('/api/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'build',
    payload: {
      blueprint: 'saas-starter-with-db',
      variables: {}
    }
  })
});
```

**Benefits**:
- Non-blocking execution
- Progress tracking
- Logs collection
- Cancellable

## Blueprint Structure

### Basic Format

```json
{
  "name": "Blueprint Name",
  "description": "What this blueprint does",
  "steps": [
    {
      "builder": "builder-id",
      "variables": {
        "VAR_NAME": "value"
      }
    }
  ]
}
```

### Field Reference

- `name` (string): Display name for the blueprint
- `description` (string): Short description of what gets created
- `steps` (array): Sequential list of builder invocations
  - `builder` (string): Builder ID (must match `manifest.json` id)
  - `variables` (object): Variables passed to the builder

### Example with Multiple Steps

```json
{
  "name": "Custom SaaS",
  "description": "SaaS with custom entities",
  "steps": [
    {
      "builder": "database-schema",
      "variables": {
        "TABLE_NAME": "customers",
        "COLUMNS": [
          {"name": "id", "type": "uuid", "primary": true},
          {"name": "email", "type": "text"}
        ]
      }
    },
    {
      "builder": "nextjs-api-route",
      "variables": {
        "ROUTE_NAME": "customers"
      }
    },
    {
      "builder": "supabase-setup",
      "variables": {}
    }
  ]
}
```

## Integration with Existing Systems

### Diff Preview

Preview blueprint changes before applying:

```bash
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{
    "blueprint": "saas-starter",
    "variables": {}
  }'
```

**Response includes**:
- File paths (`to`)
- Status (`create`, `modify`, `skip`)
- Unified diff for each file
- Size comparison

### Selective Apply

Apply only specific files from blueprint:

```typescript
// 1. Preview blueprint
const preview = await fetch('/api/diff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ blueprint: 'saas-starter', variables: {} })
}).then(r => r.json());

// 2. Select files to apply
const filesToApply = preview.result.files
  .filter(f => f.status === 'create') // Only new files
  .map(f => f.to);

// 3. Apply selected files
await fetch('/api/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blueprint: 'saas-starter',
    variables: {},
    files: filesToApply
  })
});
```

### Rollback

Restore from backups if blueprint application fails:

```bash
# List available backups
curl http://localhost:3000/api/rollback

# Restore specific file
curl -X POST http://localhost:3000/api/rollback \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "target": "web-app/lib/plans.ts"
  }'
```

## Creating Custom Blueprints

### 1. Define Blueprint JSON

Create `blueprints/my-custom-blueprint.json`:

```json
{
  "name": "My Custom Blueprint",
  "description": "Custom SaaS setup with specific features",
  "steps": [
    {
      "builder": "plan-caps",
      "variables": {}
    },
    {
      "builder": "nextjs-api-route",
      "variables": {
        "ROUTE_NAME": "custom"
      }
    }
  ]
}
```

### 2. Test Blueprint

```bash
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{
    "blueprint": "my-custom-blueprint",
    "variables": {}
  }' | jq
```

### 3. Apply Blueprint

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "blueprint": "my-custom-blueprint",
    "variables": {}
  }' | jq
```

## Variable Resolution Strategies

### 1. Static Variables

Hardcoded in blueprint:

```json
{
  "builder": "nextjs-api-route",
  "variables": {
    "ROUTE_NAME": "health"
  }
}
```

### 2. Builder Defaults

Empty object uses builder's default variables:

```json
{
  "builder": "plan-caps",
  "variables": {}
}
```

### 3. Dynamic Variables

Pass variables at runtime:

```typescript
await fetch('/api/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blueprint: 'saas-starter',
    variables: {
      // Override or extend blueprint variables
      CUSTOM_VAR: 'value'
    }
  })
});
```

### 4. Variable Merging

Runtime variables merge with blueprint variables:

```json
// Blueprint defines:
{
  "builder": "nextjs-api-route",
  "variables": {
    "ROUTE_NAME": "health"
  }
}

// Runtime passes:
{
  "variables": {
    "ENABLE_AUTH": true
  }
}

// Result:
{
  "ROUTE_NAME": "health",
  "ENABLE_AUTH": true
}
```

## Testing Blueprints

### Test Blueprint Syntax

```bash
# Validate JSON
cat blueprints/saas-starter.json | jq

# Check for required fields
cat blueprints/saas-starter.json | jq '.name, .description, .steps'
```

### Test Blueprint Preview

```bash
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{
    "blueprint": "saas-starter",
    "variables": {}
  }' | jq '.result.files | length'
```

### Test Blueprint Application

```bash
# Apply to test workspace
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=test-workspace" \
  -d '{
    "blueprint": "saas-starter",
    "variables": {}
  }' | jq '.result.wrote'
```

### Verify Generated Files

```bash
# Check all generated files exist
ls -la web-app/lib/plans.ts
ls -la web-app/app/api/health/route.ts
ls -la database/plan_defaults.sql
```

## Troubleshooting

### Blueprint not found

**Error**: `blueprint_not_found`

**Cause**: Blueprint JSON file doesn't exist in `blueprints/` directory

**Fix**: Verify file path matches blueprint ID (e.g., `saas-starter` → `blueprints/saas-starter.json`)

### Builder not found

**Error**: `builder_not_found` in step N

**Cause**: Referenced builder doesn't exist in MCP server

**Fix**: Check builder ID matches a builder in `tools/geo-builders-mcp/builders/`

### Variable validation failed

**Error**: `variable_validation_failed`

**Cause**: Required builder variables missing or invalid

**Fix**: Check builder's `manifest.json` for required variables, ensure they're provided in blueprint or at runtime

### Path blocked by allowlist

**Error**: `blocked_by_allowlist`

**Cause**: Builder tries to write outside allowed directories

**Fix**: Ensure builder templates write to `web-app/`, `src/`, `database/`, `docs/`, or `tools/`

### Partial application

**Symptom**: Some files applied, some failed

**Cause**: Individual file errors (permissions, disk space, etc.)

**Fix**: Check `results[]` array for specific errors, restore from backups if needed

## Performance Considerations

### Blueprint Size

- **Small** (2-3 builders): < 1 second
- **Medium** (4-7 builders): 1-3 seconds
- **Large** (8+ builders): 3-10 seconds

Execution time depends on:
- Number of builders
- Template complexity
- File system I/O
- MCP server responsiveness

### Optimization Strategies

1. **Minimize builders**: Combine related templates in single builder
2. **Use selective apply**: Apply only changed files
3. **Run as background job**: Use jobs queue for large blueprints
4. **Cache previews**: Reuse diff results when variables unchanged

## Security Considerations

### Path Allowlist

Blueprints respect the same allowlist as individual builders:
- `web-app/`
- `src/`
- `database/`
- `docs/`
- `tools/`

Files outside these paths are **blocked**.

### Workspace Isolation

Blueprints require:
- Active workspace set (`active_workspace` cookie)
- User authentication (Supabase session)

Ensures blueprints only apply to user's workspace.

### Automatic Backups

`.bak` files created before overwriting allow rollback if blueprint application fails or produces unexpected results.

## Advanced Patterns

### Conditional Steps

Use dynamic variables to conditionally include steps:

```typescript
const steps = [
  { builder: 'plan-caps', variables: {} },
  // Conditionally add database step
  ...(includeDb ? [{ builder: 'database-schema', variables: {...} }] : []),
  { builder: 'supabase-setup', variables: {} }
];

await fetch('/api/apply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    blueprint: 'custom',
    steps // Pass dynamic steps
  })
});
```

### Variable Inheritance

Later steps can reference outputs from earlier steps:

```json
{
  "steps": [
    {
      "builder": "database-schema",
      "variables": {
        "TABLE_NAME": "projects"
      }
    },
    {
      "builder": "nextjs-api-route",
      "variables": {
        "ROUTE_NAME": "projects", // Matches table name
        "TABLE_REF": "projects"
      }
    }
  ]
}
```

### Composition

Blueprints can reference other blueprints:

```json
{
  "name": "Extended SaaS",
  "description": "SaaS starter + custom features",
  "steps": [
    {
      "blueprint": "saas-starter" // Reference existing blueprint
    },
    {
      "builder": "custom-feature",
      "variables": {}
    }
  ]
}
```

## Future Enhancements

- **Blueprint validation**: Schema validation for blueprint JSON
- **Blueprint versioning**: Track blueprint changes over time
- **Blueprint marketplace**: Share blueprints across projects
- **Variable schemas**: Define required/optional variables per blueprint
- **Dependency resolution**: Auto-detect missing builders
- **Blueprint templates**: Generate blueprint JSON from UI
- **Blueprint testing**: Automated tests for blueprint outputs

## References

- [Selective Apply](./SELECTIVE_APPLY.md)
- [Diff Preview](./DIFF_PREVIEW.md)
- [Rollback from Backups](./ROLLBACK.md)
- [Jobs Queue](./JOBS_QUEUE.md)
- [Plan Caps Builder](../tools/geo-builders-mcp/builders/plan-caps/README.md)
- [Usage Metering](./USAGE_METERING_QUOTAS.md)
