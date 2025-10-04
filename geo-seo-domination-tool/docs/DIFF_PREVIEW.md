# Diff Preview (Conflicts-aware)

**What's included**
- `POST /api/diff` → calls MCP `preview_apply`, compares each file with the repo, returns unified diffs + status `create|modify|skip`.
- `lib/diff.ts` → tiny LCS-based unified diff generator (no dependencies).
- **UI**: a Diff Preview panel (`DiffPanel.tsx`) that can be integrated into `/projects/builds` page where you enter a builder id and variables JSON, then view per-file diffs.

## Features

### Diff API (`/api/diff`)

**Endpoint**: `POST /api/diff`

**Request Body**:
```json
{
  "id": "nextjs-api-route",
  "variables": {
    "ROUTE_NAME": "health"
  }
}
```

**Response**:
```json
{
  "ok": true,
  "result": {
    "files": [
      {
        "to": "web-app/app/api/health/route.ts",
        "status": "create",
        "exists": false,
        "bytes": {
          "before": 0,
          "after": 256
        },
        "diff": "--- a/web-app/app/api/health/route.ts\n+++ b/web-app/app/api/health/route.ts\n@@ -0,0 +1,8 @@\n+import { NextResponse } from 'next/server';\n+\n+export async function GET() {\n+  return NextResponse.json({ status: 'ok' });\n+}\n"
      }
    ]
  }
}
```

**Status Values**:
- `create`: File does not exist yet (will be created)
- `modify`: File exists and content would change (diff shown)
- `skip`: File exists but content is identical (no changes)

### Diff Library (`lib/diff.ts`)

Provides `unifiedDiff()` function that generates standard unified diff format:

```typescript
import { unifiedDiff } from '@/lib/diff';

const before = 'line 1\nline 2\nline 3';
const after = 'line 1\nline 2 modified\nline 3';
const diff = unifiedDiff(before, after, 'myfile.ts', 3);

console.log(diff);
// --- a/myfile.ts
// +++ b/myfile.ts
// @@ -1,3 +1,3 @@
//  line 1
// -line 2
// +line 2 modified
//  line 3
```

**Features**:
- LCS-based algorithm (Longest Common Subsequence)
- Configurable context lines (default: 3)
- No external dependencies
- Standard unified diff format

### Diff Preview UI Component

**Component**: `DiffPanel.tsx`

Provides interactive diff preview interface:

```tsx
import { DiffPanel } from './DiffPanel';

export default function BuildsPage() {
  return (
    <div>
      <h1>Project Builds</h1>
      <DiffPanel />
      {/* Rest of your builds page */}
    </div>
  );
}
```

**UI Features**:
- Builder ID input field
- Variables JSON textarea (with validation)
- Preview button (disabled when invalid)
- Per-file diff display with:
  - File status badge (CREATE/MODIFY/SKIP)
  - File path
  - Byte counts (before/after)
  - Syntax-highlighted diff output

## How to Use

### 1. API Usage

```typescript
async function previewBuilder(builderId: string, variables: Record<string, any>) {
  const response = await fetch('/api/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: builderId, variables })
  });

  const data = await response.json();

  if (!data.ok) {
    console.error('Preview failed:', data.error);
    return;
  }

  data.result.files.forEach(file => {
    console.log(`[${file.status}] ${file.to}`);
    if (file.diff) {
      console.log(file.diff);
    }
  });
}

// Preview a builder
await previewBuilder('nextjs-api-route', { ROUTE_NAME: 'health' });
```

### 2. UI Integration

Add the `DiffPanel` component to your builds page:

```tsx
// web-app/app/projects/builds/page.tsx
import { DiffPanel } from './DiffPanel';

export default function BuildsPage() {
  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      <h1 className='text-3xl font-bold'>Project Builds</h1>

      {/* Diff Preview Panel */}
      <DiffPanel />

      {/* Your existing builds UI */}
      <BuilderList />
    </div>
  );
}
```

### 3. Standalone Usage

Use the diff preview before applying any builder:

1. Open `/projects/builds` and locate the **Diff Preview** panel
2. Enter a builder id (e.g., `quota-check-lib`)
3. Enter variables JSON (e.g., `{}` for no variables)
4. Click **Preview Diff**
5. Review the proposed changes:
   - **CREATE**: New files to be created
   - **MODIFY**: Existing files that will change (see diff)
   - **SKIP**: Files that won't change
6. If satisfied, use your existing **Apply** action to write files

## Examples

### Example 1: Preview Quota Check Library

```bash
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{
    "id": "quota-check-lib",
    "variables": {}
  }' | jq
```

### Example 2: Preview with Variables

```bash
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{
    "id": "nextjs-api-route",
    "variables": {
      "ROUTE_NAME": "users",
      "METHOD": "POST"
    }
  }' | jq
```

### Example 3: Check for Conflicts

```typescript
const response = await fetch('/api/diff', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: 'supabase-auth-pages', variables: {} })
});

const data = await response.json();

const conflicts = data.result.files.filter(f => f.status === 'modify');

if (conflicts.length > 0) {
  console.warn('These files will be modified:');
  conflicts.forEach(f => {
    console.log(`  - ${f.to} (${f.bytes.before} → ${f.bytes.after} bytes)`);
  });

  // Show user the diffs for review
  conflicts.forEach(f => {
    console.log(`\nDiff for ${f.to}:`);
    console.log(f.diff);
  });
}
```

## Integration Patterns

### Pre-Apply Workflow

```typescript
async function safeApplyBuilder(builderId: string, variables: any) {
  // 1. Preview changes
  const preview = await fetch('/api/diff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: builderId, variables })
  }).then(r => r.json());

  if (!preview.ok) {
    throw new Error(preview.error);
  }

  // 2. Check for conflicts
  const conflicts = preview.result.files.filter(f => f.status === 'modify');

  if (conflicts.length > 0) {
    const confirmed = confirm(
      `This will modify ${conflicts.length} existing file(s). Continue?`
    );
    if (!confirmed) return;
  }

  // 3. Apply builder
  const apply = await fetch('/api/builds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'apply_builder',
      params: { id: builderId, variables }
    })
  }).then(r => r.json());

  return apply;
}
```

### Diff Review Modal

```tsx
function DiffReviewModal({ builderId, variables, onConfirm, onCancel }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/diff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: builderId, variables })
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setFiles(data.result.files);
        setLoading(false);
      });
  }, [builderId, variables]);

  const creates = files.filter(f => f.status === 'create').length;
  const modifies = files.filter(f => f.status === 'modify').length;

  return (
    <div className='modal'>
      <h2>Review Changes</h2>
      {loading ? (
        <p>Loading preview...</p>
      ) : (
        <>
          <p>
            This will create {creates} file(s) and modify {modifies} file(s).
          </p>
          <div className='diff-list'>
            {files.map((f, i) => (
              <div key={i}>
                <h3>[{f.status}] {f.to}</h3>
                {f.diff && <pre>{f.diff}</pre>}
              </div>
            ))}
          </div>
          <div className='actions'>
            <button onClick={onConfirm}>Apply Changes</button>
            <button onClick={onCancel}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}
```

## Testing

### Test Diff Generation

```typescript
import { unifiedDiff } from '@/lib/diff';

const before = `function hello() {
  console.log('Hello');
}`;

const after = `function hello(name: string) {
  console.log(\`Hello \${name}\`);
}`;

const diff = unifiedDiff(before, after, 'hello.ts', 3);
console.log(diff);

// Expected output:
// --- a/hello.ts
// +++ b/hello.ts
// @@ -1,3 +1,3 @@
// -function hello() {
// -  console.log('Hello');
// +function hello(name: string) {
// +  console.log(`Hello ${name}`);
//  }
```

### Test API Endpoint

```bash
# Test with existing builder
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{"id":"quota-check-lib","variables":{}}' \
  | jq '.result.files[] | {to, status, bytes}'

# Test with invalid builder
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{"id":"nonexistent","variables":{}}' \
  | jq

# Test without id
curl -X POST http://localhost:3000/api/diff \
  -H "Content-Type: application/json" \
  -d '{"variables":{}}' \
  | jq
```

## Troubleshooting

### Diff not showing changes

1. Verify file paths are correct (relative to repo root)
2. Check line endings (CRLF vs LF)
3. Ensure builder produces valid content

### Preview fails

1. Verify MCP server is built: `npm run build` in `tools/geo-builders-mcp`
2. Check builder exists: `curl http://localhost:3000/api/builds | jq`
3. Verify variables are valid JSON

### UI not updating

1. Check browser console for errors
2. Verify `/api/diff` endpoint is accessible
3. Clear browser cache and reload

## Performance Notes

- LCS algorithm is O(n*m) where n and m are line counts
- For very large files (>10,000 lines), diff generation may be slow
- Consider pagination or virtualization for displaying many files
- Diff computation happens server-side (no client impact)

## Security Considerations

- Diff API does not enforce quota (read-only operation)
- File paths are validated to be within repo root
- No authentication required for preview (reads only)
- Consider adding authentication if repo contains sensitive data

## Future Enhancements

### Syntax Highlighting

```tsx
import Prism from 'prismjs';

function HighlightedDiff({ diff, language }) {
  const highlighted = Prism.highlight(diff, Prism.languages[language], language);
  return <pre dangerouslySetInnerHTML={{ __html: highlighted }} />;
}
```

### Side-by-Side View

Show before/after in split view instead of unified diff.

### Interactive Apply

Allow applying changes file-by-file instead of all-or-nothing.

### Conflict Resolution

For modified files, show inline conflict markers and allow manual resolution.

## References

- [Unified Diff Format](https://www.gnu.org/software/diffutils/manual/html_node/Detailed-Unified.html)
- [LCS Algorithm](https://en.wikipedia.org/wiki/Longest_common_subsequence_problem)
- [MCP Preview Apply](../../tools/geo-builders-mcp/README.md)
