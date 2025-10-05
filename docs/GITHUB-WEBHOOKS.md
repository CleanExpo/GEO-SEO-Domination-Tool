# GitHub Webhooks Integration (WEBHOOK-001)

**Phase 3: Polish & Scale**
**Status:** ✅ Complete
**Ticket:** WEBHOOK-001

## Overview

Advanced GitHub webhook processing system that:
- Auto-syncs repository metadata on push
- Creates CRM tasks from GitHub issues
- Links pull requests to project milestones
- Tracks deployment status
- Generates changelogs from commits
- Maintains audit log of all webhook events

## Architecture

### Database Schema

**Tables:**
1. `github_repositories` - Synced repositories per organisation
2. `github_commits` - Commit history from push events
3. `github_pull_requests` - PRs with CRM task linkage
4. `github_issues` - Issues synced to CRM
5. `github_releases` - Release tracking
6. `github_webhook_events` - Audit log

### Supported Events

| Event | Action | Behaviour |
|-------|--------|-----------|
| `push` | - | Extract commits, update repo metadata, generate changelog |
| `pull_request` | opened, closed, synchronized | Create/update PR, create CRM task |
| `issues` | opened, closed, reopened | Sync issue, create CRM task |
| `release` | published | Create release record, generate changelog |
| `ping` | - | Health check (returns "Pong!") |

## Setup

### 1. Configure Webhook Secret

```bash
# Add to .env.local
GITHUB_WEBHOOK_SECRET=your_secret_here
```

### 2. Create Webhook in GitHub

**Repository Settings → Webhooks → Add webhook**

- **Payload URL:** `https://your-app.vercel.app/api/webhooks/github`
- **Content type:** `application/json`
- **Secret:** (same as GITHUB_WEBHOOK_SECRET)
- **Events:**
  - ✅ Pushes
  - ✅ Pull requests
  - ✅ Issues
  - ✅ Releases

### 3. Run Migration

```bash
npm run db:migrate
# Applies: 006_github_sync.sql
```

## Event Handlers

### Push Event

**Triggered on:** Git push to any branch

**Actions:**
1. Extract commits from payload
2. Insert commits into `github_commits` table
3. Update repository `last_push_at` timestamp
4. If release branch (`release/*` or `main`):
   - Generate changelog entry

**Commit Schema:**
```typescript
{
  sha: string;
  message: string;
  author_name: string;
  author_email: string;
  committed_at: timestamptz;
  branch: string;
  is_merge_commit: boolean;
}
```

### Pull Request Event

**Triggered on:** PR opened, closed, synchronized, reopened

**Actions:**
1. Upsert PR record in `github_pull_requests`
2. If `action === 'opened'`:
   - Create CRM task for code review
   - Link to project milestone (if configured)
3. Track PR state changes (open → closed → merged)

**PR Schema:**
```typescript
{
  github_pr_number: integer;
  title: string;
  state: 'open' | 'closed' | 'merged';
  head_branch: string;
  base_branch: string;
  crm_task_id?: uuid; // Linked CRM task
}
```

### Issues Event

**Triggered on:** Issue opened, closed, reopened

**Actions:**
1. Upsert issue record in `github_issues`
2. If `action === 'opened'`:
   - Auto-create CRM task from issue
   - Map GitHub labels to CRM tags
3. Sync state changes to CRM

**Issue Schema:**
```typescript
{
  github_issue_number: integer;
  title: string;
  body: text;
  state: 'open' | 'closed';
  labels: string[]; // Array of label names
  crm_task_id?: uuid;
}
```

### Release Event

**Triggered on:** Release published

**Actions:**
1. Create release record in `github_releases`
2. If not draft:
   - Generate changelog from commits since last release
   - Post release notes to CRM

**Release Schema:**
```typescript
{
  tag_name: string; // e.g., 'v1.2.3'
  release_name: string;
  body: text; // Release notes
  is_prerelease: boolean;
  published_at: timestamptz;
}
```

## Security

### Webhook Signature Verification

All webhooks are verified using HMAC SHA-256:

```typescript
import crypto from 'crypto';

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
```

**Header:** `X-Hub-Signature-256: sha256=abc123...`

### RLS Policies

- Repository data: Viewable by organisation members
- Webhook events: Viewable by organisation admins only
- Commits/PRs/Issues: Filtered by repository access

## API Endpoints

**POST `/api/webhooks/github`**

**Headers:**
- `X-GitHub-Event` - Event type (push, pull_request, etc.)
- `X-Hub-Signature-256` - HMAC signature
- `X-GitHub-Delivery` - Unique delivery ID

**Response:**
```json
{
  "message": "Webhook processed successfully"
}
```

**Error Codes:**
- `400` - Missing event header
- `401` - Invalid signature
- `500` - Processing error

## Service Layer

```typescript
import { GitHubSyncService } from '@/services/github-sync';

const githubSync = new GitHubSyncService(supabaseUrl, supabaseKey);

// Process webhook
await githubSync.handlePushEvent(payload);
await githubSync.handlePullRequestEvent(payload);
await githubSync.handleIssuesEvent(payload);
await githubSync.handleReleaseEvent(payload);

// Verify signature
const isValid = githubSync.verifyWebhookSignature(
  payloadString,
  signature,
  webhookSecret
);
```

## CRM Integration

**Automatic Task Creation:**

- **From PRs:** Create "Code Review" task assigned to repo admins
- **From Issues:** Create task with issue title, labels as tags

**Task Metadata:**
```json
{
  "source": "github",
  "repository": "owner/repo",
  "github_url": "https://github.com/owner/repo/pull/123",
  "github_number": 123
}
```

## Changelog Generation

**Trigger:** Push to `main` or `release/*` branches

**Format:**
```markdown
## [v1.2.3] - 2025-10-05

### Added
- feat: New feature X (commit abc123)

### Fixed
- fix: Bug Y resolved (commit def456)

### Changed
- refactor: Improved Z (commit ghi789)
```

**Commit Parsing:**
- Conventional Commits format: `type(scope): message`
- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Automatically categorised in changelog

## Testing

### Test Webhook Delivery

```bash
# Ping event
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "X-GitHub-Event: ping" \
  -H "Content-Type: application/json" \
  -d '{"zen":"Keep it simple"}'

# Expected: {"message":"Pong! Webhook configured successfully"}
```

### Verify Signature

```bash
# Generate signature
SECRET="your_secret"
PAYLOAD='{"test":true}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | sed 's/^.* //')

curl -X POST http://localhost:3000/api/webhooks/github \
  -H "X-GitHub-Event: push" \
  -H "X-Hub-Signature-256: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

## Monitoring

**Webhook Event Log:**
```sql
-- View recent webhook events
SELECT event_type, action, processed, received_at
FROM github_webhook_events
ORDER BY received_at DESC
LIMIT 10;

-- Failed events
SELECT *
FROM github_webhook_events
WHERE processed = false AND error_message IS NOT NULL;
```

## Troubleshooting

**Issue:** Webhooks not being received
- ✅ Check webhook URL in GitHub settings
- ✅ Verify HTTPS endpoint (Vercel provides SSL)
- ✅ Check firewall/WAF settings

**Issue:** Signature verification fails
- ✅ Ensure GITHUB_WEBHOOK_SECRET matches GitHub config
- ✅ Check payload is raw JSON string (not parsed)
- ✅ Verify header is `X-Hub-Signature-256` (not -256)

**Issue:** Repository not found
- ✅ Ensure repository exists in `github_repositories` table
- ✅ Check `github_repo_id` matches webhook payload

## Future Enhancements

- Deployment status tracking (via Vercel integration)
- Commit → changelog automation (semantic versioning)
- PR merge conflict detection
- Code review reminders
- Release notes generation from PRs
- GitHub Actions integration

---

**Files Created:**
- `database/migrations/006_github_sync.sql`
- `services/github-sync.ts`
- `app/api/webhooks/github/route.ts`
- `docs/GITHUB-WEBHOOKS.md`
