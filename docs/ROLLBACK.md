# Rollback from Backups (.bak)

**What it does**
- Lists all `*.bak` snapshots under allowlisted folders (same allowlist as Selective Apply).
- Restores a selected target by copying its `.bak` contents back onto the file.
- Requires workspace and authentication.

## Features

### Backup Discovery

Scans all allowed directories for `.bak` files:
- `web-app/` - Next.js application
- `src/` - Electron app source
- `database/` - Database schemas
- `docs/` - Documentation
- `tools/` - Build tools

For each backup found, tracks:
- Backup file path (`.bak`)
- Target file path (original)
- Backup file size
- Current target file size (or null if deleted)
- Last modified time

### One-Click Restore

Simply click "Restore" to:
1. Read content from `.bak` file
2. Overwrite target file with backup content
3. Preserve the `.bak` file for future rollbacks

### Safety Guards

- **Allowlist enforcement**: Only files in allowed directories can be restored
- **Workspace required**: Active workspace must be set
- **Authentication required**: User must be logged in
- **Backup verification**: Checks `.bak` file exists before restore

## API Reference

### GET /api/rollback

List all backup files.

**Response:**
```json
{
  "ok": true,
  "result": {
    "backups": [
      {
        "bak": "web-app/lib/quota.ts.bak",
        "target": "web-app/lib/quota.ts",
        "bytesBak": 1024,
        "bytesTarget": 2048,
        "mtimeMs": 1234567890000
      },
      {
        "bak": "web-app/app/api/health/route.ts.bak",
        "target": "web-app/app/api/health/route.ts",
        "bytesBak": 512,
        "bytesTarget": null,
        "mtimeMs": 1234567890000
      }
    ]
  }
}
```

**Fields:**
- `bak`: Path to backup file (with `.bak` extension)
- `target`: Path to original file (without `.bak`)
- `bytesBak`: Size of backup file in bytes
- `bytesTarget`: Size of current target file (null if deleted)
- `mtimeMs`: Last modified timestamp in milliseconds

**Sorting**: Backups are sorted by most recent first (descending `mtimeMs`).

### POST /api/rollback

Restore a file from its backup.

**Request:**
```json
{
  "target": "web-app/lib/quota.ts"
}
```

**Response (Success):**
```json
{
  "ok": true
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "ok": false,
  "error": "target required"
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
  "error": "bak_not_found"
}
```

or

```json
{
  "ok": false,
  "error": "blocked_by_allowlist"
}
```

## Usage

### Via UI

1. Open `/projects/builds` → Rollback from Backups panel
2. View list of all backup files (sorted by most recent)
3. Click **Restore** button next to the file you want to rollback
4. File is restored from its `.bak` backup
5. Success/error message is displayed

### Via API

```typescript
async function rollbackFile(targetPath: string) {
  const response = await fetch('/api/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: targetPath })
  });

  const data = await response.json();

  if (data.ok) {
    console.log(`Restored ${targetPath} from backup`);
  } else {
    console.error('Rollback failed:', data.error);
  }

  return data;
}

// Example: Restore quota library
await rollbackFile('web-app/lib/quota.ts');
```

### List Backups Programmatically

```typescript
async function getBackups() {
  const response = await fetch('/api/rollback');
  const data = await response.json();

  if (data.ok) {
    const backups = data.result.backups;

    // Group by directory
    const byDir = backups.reduce((acc, b) => {
      const dir = b.target.split('/').slice(0, -1).join('/');
      if (!acc[dir]) acc[dir] = [];
      acc[dir].push(b);
      return acc;
    }, {});

    console.log('Backups by directory:', byDir);
  }

  return data;
}
```

### Curl Examples

```bash
# List all backups
curl http://localhost:3000/api/rollback | jq

# Restore a file
curl -X POST http://localhost:3000/api/rollback \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "target": "web-app/lib/quota.ts"
  }' | jq
```

## Integration Patterns

### Batch Rollback

```typescript
async function rollbackMultiple(targets: string[]) {
  const results = [];

  for (const target of targets) {
    const result = await fetch('/api/rollback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target })
    }).then(r => r.json());

    results.push({ target, ok: result.ok, error: result.error });
  }

  const succeeded = results.filter(r => r.ok).length;
  console.log(`Restored ${succeeded}/${targets.length} files`);

  return results;
}

// Rollback multiple files
await rollbackMultiple([
  'web-app/lib/quota.ts',
  'web-app/lib/plans.ts',
  'web-app/app/api/jobs/route.ts'
]);
```

### Selective Rollback

```typescript
async function rollbackRecent(minutes: number = 60) {
  const response = await fetch('/api/rollback');
  const data = await response.json();

  if (!data.ok) {
    throw new Error('Failed to fetch backups');
  }

  const cutoff = Date.now() - (minutes * 60 * 1000);
  const recent = data.result.backups.filter(b => b.mtimeMs >= cutoff);

  console.log(`Found ${recent.length} backups from last ${minutes} minutes`);

  for (const backup of recent) {
    const confirm = window.confirm(`Restore ${backup.target}?`);
    if (confirm) {
      await fetch('/api/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: backup.target })
      });
    }
  }
}
```

### Compare Before Restore

```typescript
async function compareAndRestore(target: string) {
  // 1. Get backup info
  const list = await fetch('/api/rollback').then(r => r.json());
  const backup = list.result.backups.find(b => b.target === target);

  if (!backup) {
    throw new Error('Backup not found');
  }

  // 2. Show size comparison
  console.log(`Backup: ${backup.bytesBak} bytes`);
  console.log(`Current: ${backup.bytesTarget ?? 'deleted'} bytes`);

  // 3. Confirm with user
  const proceed = confirm(
    `Restore ${target}?\n` +
    `This will replace ${backup.bytesTarget ?? 0} bytes with ${backup.bytesBak} bytes`
  );

  if (!proceed) return;

  // 4. Restore
  await fetch('/api/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target })
  });
}
```

## Utilities Reference

### Rollback Utilities (`lib/rollback.ts`)

```typescript
import {
  listBackups,
  restoreBackup,
  BakEntry
} from '@/lib/rollback';

// List all backup files
const backups: BakEntry[] = await listBackups();

// Each entry has:
// - bak: string (backup file path)
// - target: string (original file path)
// - bytesBak: number (backup size)
// - bytesTarget: number | null (current size or null if deleted)
// - mtimeMs: number (last modified timestamp)

// Restore a file from backup
await restoreBackup('web-app/lib/quota.ts');
// Reads from web-app/lib/quota.ts.bak
// Writes to web-app/lib/quota.ts
```

## Testing

### Test Backup Discovery

```typescript
import { listBackups } from '@/lib/rollback';

const backups = await listBackups();

console.log(`Found ${backups.length} backups`);

// Check sorting (most recent first)
for (let i = 1; i < backups.length; i++) {
  console.assert(
    backups[i-1].mtimeMs >= backups[i].mtimeMs,
    'Backups not sorted correctly'
  );
}

// Verify paths
backups.forEach(b => {
  console.assert(b.bak.endsWith('.bak'), 'Backup path missing .bak');
  console.assert(b.target === b.bak.slice(0, -4), 'Target path mismatch');
});
```

### Test Restore

```bash
# 1. Create a test file
echo "original content" > web-app/test.txt

# 2. Create backup
echo "backup content" > web-app/test.txt.bak

# 3. Modify original
echo "modified content" > web-app/test.txt

# 4. Restore via API
curl -X POST http://localhost:3000/api/rollback \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{"target":"web-app/test.txt"}'

# 5. Verify content
cat web-app/test.txt
# Should show: backup content
```

### Test Path Allowlist

```bash
# Allowed path (should succeed)
curl -X POST http://localhost:3000/api/rollback \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{"target":"web-app/lib/quota.ts"}' | jq

# Blocked path (should fail)
curl -X POST http://localhost:3000/api/rollback \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{"target":"config/secrets.yml"}' | jq
# Expected: {"ok":false,"error":"blocked_by_allowlist"}
```

## Troubleshooting

### No backups showing

1. Verify `.bak` files exist in allowed directories
2. Check file permissions (must be readable)
3. Ensure directories are in the allowlist
4. Refresh the UI

### Restore fails

1. **bak_not_found**: Backup file was deleted
   - Check if `.bak` file still exists
   - Run `listBackups()` to see available backups

2. **blocked_by_allowlist**: Target path not allowed
   - Verify path starts with allowed prefix
   - Check `WRITE_ALLOW` in `lib/paths.ts`

3. **workspace_required**: No active workspace
   - Set `active_workspace` cookie
   - Create/select a workspace first

### Backup file size is 0

The `.bak` file is empty. This can happen if:
- Original file was empty when backup was created
- Backup creation failed partway through

Check the backup file manually:
```bash
cat web-app/lib/quota.ts.bak
```

### Target file deleted after backup

`bytesTarget` will be `null` in the backup list. Restore will recreate the file from backup.

## Cleanup

### Remove Old Backups

```bash
# Find backups older than 7 days
find . -name "*.bak" -mtime +7

# Delete old backups
find . -name "*.bak" -mtime +7 -delete
```

### Remove All Backups

```bash
# Careful! This deletes ALL .bak files
find . -name "*.bak" -delete
```

### Selective Cleanup

```typescript
async function cleanupOldBackups(daysOld: number = 7) {
  const backups = await listBackups();
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  const old = backups.filter(b => b.mtimeMs < cutoff);

  console.log(`Found ${old.length} backups older than ${daysOld} days`);

  for (const backup of old) {
    // Delete .bak file (implement file deletion)
    console.log(`Would delete: ${backup.bak}`);
  }
}
```

## Security Considerations

- **Allowlist enforcement**: Only allowed directories can be restored
- **Workspace isolation**: Requires active workspace
- **Authentication required**: User must be logged in
- **No cross-directory traversal**: Paths are validated
- **Backup integrity**: Original `.bak` file preserved after restore

## Performance Notes

- Recursive directory scanning can be slow for large projects
- Backups are sorted in-memory (fast for reasonable numbers)
- Restore is synchronous (blocks until file is written)
- No quota enforcement on restore (considered a recovery operation)

## Future Enhancements

- **Backup retention policy**: Auto-delete backups older than X days
- **Backup compression**: `.bak.gz` for large files
- **Backup metadata**: Track when/why backup was created
- **Diff before restore**: Show diff between current and backup
- **Batch restore UI**: Select multiple files to restore at once
- **Backup search**: Filter by path, date, size
- **Restore confirmation**: Require confirmation before overwrite
- **Backup history**: Track multiple versions with timestamps

## Notes

- Only files under allowlisted prefixes can be restored
- If a target file does not exist, it will be created from the backup
- Backups are simple `.bak` siblings created by Selective Apply
- You can keep or delete `.bak` files as needed
- No automatic cleanup - backups persist until manually deleted
- Restore does not create a new backup (no `.bak.bak` files)

## References

- [Selective Apply](./SELECTIVE_APPLY.md)
- [Path Utilities](../web-app/lib/paths.ts)
- [Rollback Utilities](../web-app/lib/rollback.ts)
- [Rollback API](../web-app/app/api/rollback/route.ts)
- [Rollback UI](../web-app/app/projects/builds/RollbackPanel.tsx)
