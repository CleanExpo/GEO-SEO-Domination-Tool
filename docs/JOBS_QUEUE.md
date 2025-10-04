# Jobs Queue + Background Workers

**What you get**
- File-backed queue at `server/temp/jobs.json` with statuses and logs.
- In-process worker that sequentially runs jobs (build/deploy/api_call) and updates progress.
- **APIs**
  - `GET /api/jobs` — list latest jobs
  - `POST /api/jobs` — enqueue `{ type: 'build'|'deploy'|'api_call', payload }`
  - `GET /api/jobs/:id` — job detail
  - `POST /api/jobs/:id` `{ action: 'cancel' }` — cancel queued/running
- **UI**: `/jobs` page to create and monitor jobs.

## Features

### File-Backed Queue

Jobs are stored in `server/temp/jobs.json` with the following structure:

```json
{
  "jobs": [
    {
      "id": "1234567890-abc123",
      "type": "build",
      "workspaceId": "workspace-uuid",
      "createdBy": {
        "email": "user@example.com",
        "id": "user-uuid"
      },
      "payload": {
        "action": "apply_builder",
        "id": "nextjs-api-route",
        "variables": { "ROUTE_NAME": "health" }
      },
      "status": "succeeded",
      "pct": 100,
      "step": "done",
      "logs": ["log line 1", "log line 2"],
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

### Job Types

1. **build**: MCP builder operations
   - Runs MCP actions (preview_apply, apply_builder, etc.)
   - Logs MCP output

2. **deploy**: Docker compose operations
   - Runs docker compose commands
   - Logs stdout/stderr

3. **api_call**: Generic API call tracking
   - Placeholder for usage tracking

### Job Statuses

- **queued**: Waiting to be processed
- **running**: Currently executing
- **succeeded**: Completed successfully
- **failed**: Execution failed (see logs)
- **canceled**: Stopped by user

### Worker Process

Single in-process worker that:
1. Polls for queued jobs
2. Executes jobs sequentially
3. Updates status and progress
4. Captures logs in real-time
5. Handles errors and cancellations

## API Reference

### GET /api/jobs

List all jobs (most recent first, limit 200).

**Response:**
```json
{
  "ok": true,
  "result": {
    "jobs": [
      {
        "id": "1234567890-abc123",
        "type": "build",
        "status": "succeeded",
        "pct": 100,
        "step": "done",
        "logs": ["..."],
        "createdAt": 1234567890,
        "updatedAt": 1234567890
      }
    ]
  }
}
```

### POST /api/jobs

Enqueue a new job.

**Request:**
```json
{
  "type": "build",
  "payload": {
    "action": "apply_builder",
    "id": "nextjs-api-route",
    "variables": {
      "ROUTE_NAME": "health"
    }
  }
}
```

**Response (202 Accepted):**
```json
{
  "ok": true,
  "result": {
    "id": "1234567890-abc123"
  }
}
```

**Error (401):**
```json
{
  "ok": false,
  "error": "workspace_required"
}
```

### GET /api/jobs/:id

Get job details by ID.

**Response:**
```json
{
  "ok": true,
  "result": {
    "job": {
      "id": "1234567890-abc123",
      "type": "build",
      "status": "running",
      "pct": 50,
      "step": "mcp:run",
      "logs": ["starting...", "running builder..."],
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  }
}
```

### POST /api/jobs/:id

Cancel a job.

**Request:**
```json
{
  "action": "cancel"
}
```

**Response (200):**
```json
{
  "ok": true
}
```

**Error (409 Conflict):**
```json
{
  "ok": false
}
```

## Usage Examples

### Enqueue a Build Job

```typescript
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'build',
    payload: {
      action: 'apply_builder',
      id: 'supabase-auth-pages',
      variables: {
        LOGIN_PATH: 'login',
        DASHBOARD_PATH: 'dashboard'
      }
    }
  })
});

const data = await response.json();
console.log('Job ID:', data.result.id);
```

### Enqueue a Deploy Job

```typescript
const response = await fetch('/api/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'deploy',
    payload: {
      verb: 'up',
      composePath: '/srv/app/compose.yml',
      extraArgs: ['-d']
    }
  })
});
```

### Monitor Job Progress

```typescript
async function monitorJob(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}`);
  const data = await response.json();

  if (data.ok) {
    const job = data.result.job;
    console.log(`Status: ${job.status} (${job.pct}%)`);
    console.log(`Step: ${job.step}`);
    console.log('Logs:', job.logs.join('\n'));

    if (job.status === 'running' || job.status === 'queued') {
      // Poll again in 1 second
      setTimeout(() => monitorJob(jobId), 1000);
    }
  }
}
```

### Cancel a Job

```typescript
async function cancelJob(jobId: string) {
  const response = await fetch(`/api/jobs/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'cancel' })
  });

  const data = await response.json();
  if (data.ok) {
    console.log('Job canceled');
  } else {
    console.log('Could not cancel job (may have completed)');
  }
}
```

## UI Usage

### Jobs Page (`/jobs`)

The jobs page provides:

1. **Job Creation Form**
   - Select job type (build/deploy/api_call)
   - Configure job-specific parameters
   - Enqueue button

2. **Job Queue Display**
   - Live status updates (auto-refresh every 1.5s)
   - Progress bars (0-100%)
   - Real-time logs
   - Cancel buttons for active jobs

### Creating Jobs via UI

**Build Job:**
1. Select "build (MCP)" type
2. Choose MCP action (apply_builder, preview_apply, etc.)
3. Enter builder ID
4. Enter variables JSON
5. Click "Enqueue Job"

**Deploy Job:**
1. Select "deploy (docker compose)" type
2. Choose verb (up, down, build, ps, logs)
3. Click "Enqueue Job"

**API Call Job:**
1. Select "api_call" type
2. Click "Enqueue Job"

## Integration

### Add to Navigation

```tsx
// In your main layout or sidebar
<Link href="/jobs" className="nav-link">
  Jobs Queue
</Link>
```

### Programmatic Job Creation

```typescript
import { enqueueJob, startWorker } from '@/lib/jobs';

async function runBuilder(builderId: string, variables: any) {
  const workspaceId = getActiveWorkspaceId();

  const job = await enqueueJob(
    'build',
    workspaceId,
    { action: 'apply_builder', id: builderId, variables },
    { email: user.email, id: user.id }
  );

  startWorker();

  return job.id;
}
```

### Background Processing

The worker runs in-process and starts automatically when jobs are enqueued:

```typescript
import { startWorker } from '@/lib/jobs';

// Start worker on app initialization
startWorker();
```

## Worker Implementation

The worker loop:

1. Checks for queued jobs
2. Picks oldest queued job
3. Sets status to 'running'
4. Executes job based on type:
   - **build**: Spawns MCP process
   - **deploy**: Runs docker compose command
   - **api_call**: Placeholder (no-op)
5. Updates progress (pct, step, logs)
6. Sets final status (succeeded/failed/canceled)
7. Repeats from step 1

**Note**: Worker is single-threaded and processes jobs sequentially.

## File Database

The `filedb.ts` utility provides:

```typescript
import { readJSON, writeJSON } from '@/lib/filedb';

// Read with fallback
const data = await readJSON<{ count: number }>('mydata.json', { count: 0 });

// Write
await writeJSON('mydata.json', { count: data.count + 1 });
```

Files are stored in `server/temp/` directory.

## Testing

### Test Job Enqueue

```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Cookie: active_workspace=workspace-id" \
  -d '{
    "type": "build",
    "payload": {
      "action": "apply_builder",
      "id": "quota-check-lib",
      "variables": {}
    }
  }' | jq
```

### Test Job List

```bash
curl http://localhost:3000/api/jobs | jq
```

### Test Job Detail

```bash
curl http://localhost:3000/api/jobs/1234567890-abc123 | jq
```

### Test Job Cancel

```bash
curl -X POST http://localhost:3000/api/jobs/1234567890-abc123 \
  -H "Content-Type: application/json" \
  -d '{"action":"cancel"}' | jq
```

## Limitations

### In-Process Worker

- **Single instance**: Only one worker runs at a time
- **Sequential processing**: Jobs execute one at a time
- **Memory-bound**: Queue limited by available memory
- **Not serverless-friendly**: Requires long-running process

### For Production

For multi-instance or serverless deployments:

1. **Move queue to database**
   ```typescript
   // Use Supabase or PostgreSQL instead of file
   await supabase.from('jobs').insert({ ... });
   ```

2. **Run dedicated worker**
   ```bash
   # Separate worker process
   node worker.js
   ```

3. **Use Redis queue**
   ```typescript
   import Bull from 'bull';
   const queue = new Bull('jobs', 'redis://localhost:6379');
   ```

4. **Use task queue service**
   - AWS SQS + Lambda
   - Google Cloud Tasks
   - Vercel Cron + API routes

## Troubleshooting

### Jobs not processing

1. Verify worker is started: `startWorker()` called on app init
2. Check `server/temp/jobs.json` exists and is writable
3. Check logs in job.logs array for errors

### Jobs stuck in 'running'

1. Check worker process is alive
2. Look for errors in console/logs
3. Cancel stuck job and retry

### MCP jobs failing

1. Verify MCP server is built: `npm run build` in `tools/geo-builders-mcp`
2. Check MCP entry path: `tools/geo-builders-mcp/dist/index.js`
3. Review job logs for MCP errors

### Workspace required error

1. Ensure `active_workspace` cookie is set
2. Check workspace exists in database
3. Create workspace if needed

## Security Considerations

- Jobs require active workspace (enforced via cookie)
- User authentication checked via Supabase
- Jobs track creator (email/id) for audit
- No cross-workspace job access
- Cancel limited to job owner's workspace

## Performance Tips

1. **Limit job retention**: Clean up old completed jobs periodically
2. **Paginate job list**: Use limit/offset for large queues
3. **Debounce UI refresh**: Don't poll faster than 1s intervals
4. **Archive logs**: Move large logs to separate storage
5. **Index jobs**: Add database indexes for status/workspaceId queries

## Future Enhancements

- **Priority queue**: Add priority field for urgent jobs
- **Job dependencies**: Chain jobs (run B after A succeeds)
- **Retry logic**: Auto-retry failed jobs with backoff
- **Job scheduling**: Delayed/scheduled job execution
- **Webhooks**: Notify external services on job completion
- **Job templates**: Save/reuse common job configurations
- **Batch operations**: Enqueue multiple jobs at once
- **Job artifacts**: Attach files/outputs to completed jobs

## References

- [File Database Utility](../web-app/lib/filedb.ts)
- [Jobs Library](../web-app/lib/jobs.ts)
- [Jobs API](../web-app/app/api/jobs/route.ts)
- [Jobs UI](../web-app/app/jobs/page.tsx)
