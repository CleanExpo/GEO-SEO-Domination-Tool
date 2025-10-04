# Selective Apply from Diff

**What's included**
- `POST /api/apply` — runs MCP `preview_apply`, then writes **only** requested files.
- **Safety**: path allowlist (`web-app/`, `src/`, `database/`, `docs/`, `tools/`), backups (`.bak`) when overwriting, workspace check, and authentication.
- **UI**: checkboxes in Diff Preview panel + "Apply Selected".

## Features

### Selective File Application

Instead of applying all files from a builder at once, you can:
1. Preview changes with diffs
2. Select specific files to apply
3. Apply only the chosen files

This provides fine-grained control over builder application.

### Path Allowlist

Only files in these directories can be written:
- `web-app/` - Next.js web application
- `src/` - Electron app source
- `database/` - Database schemas and migrations
- `docs/` - Documentation
- `tools/` - Build tools and utilities

Files outside these paths are **blocked** with `blocked_by_allowlist` error.

### Automatic Backups

When overwriting existing files:
1. Original content is saved to `<filename>.bak`
2. New content is written to the original file

Example: Writing to `web-app/lib/quota.ts` creates `web-app/lib/quota.ts.bak` first.

### Workspace Requirement

All apply operations require:
- Active workspace set (via `active_workspace` cookie)
- User authentication (via Supabase)

## API Reference

### POST /api/apply

Apply selected files from a builder preview.

**Request:**
```json
{
  "id": "nextjs-api-route",
  "variables": {
    "ROUTE_NAME": "health"
  },
  "files": [
    "web-app/app/api/health/route.ts"
  ]
}
```

**Response (Success):**
```json
{
  "ok": true,
  "result": {
    "wrote": 1,
    "results": [
      {
        "to": "web-app/app/api/health/route.ts",
        "ok": true
      }
    ]
  }
}
```

**Response (Partial Success):**
```json
{
  "ok": true,
  "result": {
    "wrote": 1,
    "results": [
      {
        "to": "web-app/app/api/health/route.ts",
        "ok": true
      },
      {
        "to": "config/secrets.yml",
        "ok": false,
        "reason": "blocked_by_allowlist"
      }
    ]
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "ok": false,
  "error": "id required"
}
```

**401 Unauthorized:**
```json
{
  "ok": false,
  "error": "workspace_required"
}
```

**500 Internal Server Error:**
```json
{
  "ok": false,
  "error": "preview_failed"
}
```

## Usage

### Via UI

1. Open `/projects/builds` → Diff Preview (Selective Apply) panel
2. Enter builder id (e.g., `nextjs-api-route`)
3. Enter variables JSON (e.g., `{"ROUTE_NAME":"health"}`)
4. Click **Preview Diff**
5. Review the file diffs
6. Check the boxes next to files you want to apply
7. Click **Apply Selected**

### Via API

```typescript
async function applySelectedFiles(
  builderId: string,
  variables: Record<string, any>,
  files: string[]
) {
  const response = await fetch('/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: builderId,
      variables,
      files
    })
  });

  const data = await response.json();

  if (data.ok) {
    console.log(`Applied ${data.result.wrote}/${files.length} files`);

    // Check for failures
    const failed = data.result.results.filter(r => !r.ok);
    if (failed.length > 0) {
      console.warn('Failed to apply:', failed);
    }
  } else {
    console.error('Apply failed:', data.error);
  }

  return data;
}

// Example usage
await applySelectedFiles(
  'supabase-auth-pages',
  { LOGIN_PATH: 'login', DASHBOARD_PATH: 'dashboard' },
  [
    'web-app/app/login/page.tsx',
    'web-app/app/dashboard/page.tsx'
  ]
);
```

### Curl Example

```bash
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "id": "nextjs-api-route",
    "variables": {
      "ROUTE_NAME": "users"
    },
    "files": [
      "web-app/app/api/users/route.ts"
    ]
  }' | jq
```

## Safety Features

### 1. Preview Before Apply

The API runs `preview_apply` first to generate files, ensuring:
- Builder variables are valid
- Files can be generated successfully
- You see exactly what will be written

### 2. Path Validation

Each file is checked against the allowlist:

```typescript
import { isAllowedRelPath } from '@/lib/paths';

const allowed = isAllowedRelPath('web-app/lib/quota.ts'); // true
const blocked = isAllowedRelPath('~/.ssh/id_rsa'); // false
```

### 3. Automatic Backups

Before overwriting:

```typescript
import { writeWithBackup } from '@/lib/paths';

await writeWithBackup('/path/to/file.ts', newContent);
// Creates /path/to/file.ts.bak with old content
// Writes newContent to /path/to/file.ts
```

### 4. Error Isolation

If one file fails, others still succeed:

```json
{
  "wrote": 2,
  "results": [
    { "to": "web-app/lib/a.ts", "ok": true },
    { "to": "web-app/lib/b.ts", "ok": true },
    { "to": "config/bad.yml", "ok": false, "reason": "blocked_by_allowlist" }
  ]
}
```

## Integration Patterns

### Conditional Apply

```typescript
async function applyIfSafe(builderId: string, variables: any) {
  // 1. Preview changes
  const preview = await fetch('/api/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: builderId, variables })
  }).then(r => r.json());

  if (!preview.ok) {
    throw new Error(preview.error);
  }

  // 2. Filter safe files
  const safeFiles = preview.result.files
    .filter(f => f.status !== 'modify') // Only new files
    .map(f => f.to);

  if (safeFiles.length === 0) {
    console.log('No new files to apply');
    return;
  }

  // 3. Apply safe files
  const result = await fetch('/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: builderId, variables, files: safeFiles })
  }).then(r => r.json());

  return result;
}
```

### Interactive Confirmation

```typescript
async function applyWithConfirmation(builderId: string, variables: any) {
  const preview = await fetch('/api/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: builderId, variables })
  }).then(r => r.json());

  // Show user the diffs
  for (const file of preview.result.files) {
    console.log(`\n${file.status.toUpperCase()}: ${file.to}`);
    if (file.diff) console.log(file.diff);

    const apply = confirm(`Apply this file?`);
    if (apply) {
      await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: builderId, variables, files: [file.to] })
      });
    }
  }
}
```

### Batch Apply with Rollback

```typescript
async function applyWithRollback(builderId: string, variables: any, files: string[]) {
  const result = await fetch('/api/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: builderId, variables, files })
  }).then(r => r.json());

  if (!result.ok) {
    throw new Error(result.error);
  }

  const failed = result.result.results.filter(r => !r.ok);

  if (failed.length > 0) {
    console.warn(`${failed.length} files failed to apply`);

    // Rollback: restore from .bak files
    const succeeded = result.result.results.filter(r => r.ok);
    for (const file of succeeded) {
      // In real implementation, you'd restore from .bak files
      console.log(`Would rollback: ${file.to}`);
    }
  }

  return result;
}
```

## Utilities Reference

### Path Utilities (`lib/paths.ts`)

```typescript
import {
  repoRoot,
  isAllowedRelPath,
  absFromRel,
  ensureDirFor,
  writeWithBackup,
  WRITE_ALLOW
} from '@/lib/paths';

// Get repository root path
const root = repoRoot(); // D:\GEO_SEO_Domination-Tool\geo-seo-domination-tool

// Check if path is allowed
const allowed = isAllowedRelPath('web-app/lib/quota.ts'); // true
const blocked = isAllowedRelPath('../../../etc/passwd'); // false

// Convert relative to absolute path
const abs = absFromRel('web-app/lib/quota.ts');

// Ensure directory exists
await ensureDirFor('/path/to/file.ts'); // Creates /path/to/ if needed

// Write with automatic backup
await writeWithBackup('/path/to/file.ts', 'new content');
// Creates /path/to/file.ts.bak then writes new content

// View allowlist
console.log(WRITE_ALLOW); // ['web-app/', 'src/', 'database/', 'docs/', 'tools/']
```

## Testing

### Test Path Validation

```typescript
import { isAllowedRelPath } from '@/lib/paths';

// Allowed paths
console.assert(isAllowedRelPath('web-app/lib/quota.ts') === true);
console.assert(isAllowedRelPath('src/main.ts') === true);
console.assert(isAllowedRelPath('database/schema.sql') === true);
console.assert(isAllowedRelPath('docs/README.md') === true);
console.assert(isAllowedRelPath('tools/build.js') === true);

// Blocked paths
console.assert(isAllowedRelPath('config/secrets.yml') === false);
console.assert(isAllowedRelPath('../../../etc/passwd') === false);
console.assert(isAllowedRelPath('~/.ssh/id_rsa') === false);
```

### Test API Endpoint

```bash
# Test successful apply
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "id": "quota-check-lib",
    "variables": {},
    "files": ["web-app/lib/quota.ts"]
  }' | jq

# Test blocked path
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "id": "some-builder",
    "variables": {},
    "files": ["config/secrets.yml"]
  }' | jq

# Test missing workspace
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "id": "some-builder",
    "variables": {},
    "files": ["web-app/lib/test.ts"]
  }' | jq
```

### Test Backup Creation

```bash
# Apply a file
curl -X POST http://localhost:3000/api/apply \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "id": "quota-check-lib",
    "variables": {},
    "files": ["web-app/lib/quota.ts"]
  }'

# Verify backup was created
ls web-app/lib/quota.ts.bak
```

## Troubleshooting

### Files not applying

1. Check path is in allowlist: `isAllowedRelPath('your/path')`
2. Verify workspace cookie is set
3. Check user is authenticated
4. Review API response for specific errors

### Backup files accumulating

Backups are created every time a file is overwritten. To clean up:

```bash
# Find all backup files
find . -name "*.bak"

# Delete old backups (older than 7 days)
find . -name "*.bak" -mtime +7 -delete
```

### Preview succeeds but apply fails

1. Check file permissions
2. Verify disk space available
3. Check for file locks (file in use)
4. Review specific error in `results[].reason`

## Security Considerations

- **Allowlist enforcement**: Prevents writing to sensitive paths
- **Workspace isolation**: Users can only apply to their active workspace
- **Authentication required**: Anonymous users cannot apply files
- **Backup safety net**: Original content preserved before overwrite
- **Error containment**: One file failure doesn't abort entire operation

## Performance Notes

- Each file is written sequentially (not parallel)
- Large files may take longer to write
- Backup creation doubles write time for existing files
- Preview runs before apply (adds MCP execution time)

## Future Enhancements

- **Dry run mode**: Preview writes without actually writing
- **Rollback API**: Restore from .bak files
- **Conflict resolution**: Merge changes instead of overwrite
- **Diff application**: Apply patch-style diffs instead of full content
- **Batch operations**: Apply multiple builders at once
- **File locking**: Prevent concurrent writes to same file
- **Backup retention**: Automatic cleanup of old .bak files

## References

- [Diff Preview](./DIFF_PREVIEW.md)
- [Path Utilities](../web-app/lib/paths.ts)
- [Apply API](../web-app/app/api/apply/route.ts)
- [Selective Apply UI](../web-app/app/projects/builds/DiffPanelSelective.tsx)
