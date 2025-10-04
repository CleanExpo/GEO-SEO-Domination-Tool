# Audit Log + Rate Limiting

This update adds comprehensive audit logging and rate limiting capabilities to protect sensitive API endpoints and track all user actions.

## Overview

This feature adds:
- **Per-route rate limiting** utilities in `web-app/lib/rate.ts` (token-bucket style, sliding window, in-memory)
- **Append-only audit log** stored at `server/logs/audit.json` via `web-app/lib/audit.ts`
- **Admin-only audit viewer** at `GET /api/audit` (requires `profiles.role = 'admin'`)
- **Hardened** `/api/admin/users` (GET/POST) using both wrappers, with `X-RateLimit-Remaining` headers

## Features

### Rate Limiting (`lib/rate.ts`)
- **In-memory sliding window** algorithm
- **Per-route configuration** (windowMs, max requests)
- **Custom key support** for flexible rate limiting strategies
- **Response headers** (`X-RateLimit-Remaining`)
- **Automatic cleanup** of expired hits

### Audit Logging (`lib/audit.ts`)
- **Append-only** JSON file storage at `server/logs/audit.json`
- **Auto-rotation** (keeps last 10,000 events)
- **Rich event data** (timestamp, IP, user, path, method, action, success, duration, metadata)
- **Admin-only read access** via `/api/audit` endpoint

### Protected Endpoints
- **`GET /api/admin/users`**: Rate limited to 60 requests/minute per IP
- **`POST /api/admin/users`**: Rate limited to 20 requests/minute per IP
- Both endpoints log all requests to audit log with success/failure status

## Prerequisites

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE=eyJhbGci...  # Server-side only
```

### Package Installation
```bash
npm i -w web-app pathe  # For cross-platform path handling
```

## Testing

### Test Rate Limiting

#### Manual Testing
```bash
# Make 61 requests to trigger rate limit
for i in {1..61}; do
  curl http://localhost:3000/api/admin/users \
    -H "Cookie: sb-access-token=..." \
    -w "\nStatus: %{http_code}\n"
done

# Watch for 429 responses after request 60
```

Expected output:
```json
// Requests 1-60: 200 OK
{"ok":true,"result":{"users":[...]}}

// Request 61: 429 Too Many Requests
{"ok":false,"error":"rate_limited","retryAfterMs":12345}
```

#### Check Rate Limit Headers
```bash
curl -I http://localhost:3000/api/admin/users \
  -H "Cookie: sb-access-token=..."

# Response includes:
X-RateLimit-Remaining: 59
```

### Test Audit Logging

#### Trigger Some Events
```bash
# List users (should succeed)
curl http://localhost:3000/api/admin/users \
  -H "Cookie: sb-access-token=..."

# Update role (should succeed)
curl -X POST http://localhost:3000/api/admin/users \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","role":"pro"}'

# Unauthorized access (should fail)
curl http://localhost:3000/api/admin/users
```

#### View Audit Log
```bash
curl http://localhost:3000/api/audit \
  -H "Cookie: sb-access-token=..."  # Admin only

# Optional: Limit results
curl http://localhost:3000/api/audit?limit=100 \
  -H "Cookie: sb-access-token=..."
```

Expected output:
```json
{
  "ok": true,
  "result": {
    "events": [
      {
        "ts": 1704123456789,
        "ip": "192.168.1.100",
        "user": {
          "id": "uuid-here",
          "email": "admin@example.com"
        },
        "path": "/api/admin/users",
        "method": "GET",
        "action": "list_users",
        "ok": true,
        "status": 200,
        "ms": 45
      },
      {
        "ts": 1704123457890,
        "ip": "192.168.1.100",
        "user": {
          "id": "uuid-here",
          "email": "admin@example.com"
        },
        "path": "/api/admin/users",
        "method": "POST",
        "action": "set_role",
        "ok": true,
        "status": 200,
        "ms": 67,
        "meta": {
          "targetEmail": "user@example.com",
          "newRole": "pro"
        }
      }
    ]
  }
}
```

#### Inspect Audit File Directly
```bash
cat server/logs/audit.json | jq '.events[-5:]'  # Last 5 events
```

## Rate Limiting Details

### Algorithm
- **Sliding window**: Only counts requests within the time window
- **Token bucket**: Each request consumes a token
- **Auto-cleanup**: Expired timestamps removed automatically

### Configuration
```typescript
// lib/rate.ts
rateLimitCheck(identifier, {
  windowMs: 60_000,  // 1 minute
  max: 30,           // 30 requests
  key: 'custom-key'  // Optional override
});
```

### Response Format
```typescript
{
  allowed: boolean,      // Whether request is allowed
  remaining: number,     // Tokens remaining
  resetMs: number        // Time until window reset (ms)
}
```

### Custom Rate Limits
```typescript
// Stricter limit for sensitive endpoint
const rl = rateLimitCheck(
  `${ip}:POST:/api/admin/delete-user`,
  { windowMs: 3600_000, max: 5 }  // 5 per hour
);
```

## Audit Logging Details

### Event Structure
```typescript
type AuditEvent = {
  ts: number;                           // Unix timestamp (ms)
  ip?: string | null;                   // Client IP address
  user?: {                              // Authenticated user
    id?: string | null;
    email?: string | null;
  };
  path: string;                         // API path
  method: string;                       // HTTP method
  action?: string;                      // Semantic action name
  ok: boolean;                          // Success/failure
  status: number;                       // HTTP status code
  ms: number;                           // Response time
  meta?: any;                           // Additional metadata
};
```

### Usage Pattern
```typescript
import { appendAudit } from '@/lib/audit';

const t0 = Date.now();
try {
  // ... perform operation
  await appendAudit({
    ts: Date.now(),
    ip: clientIp(req),
    user: { id: user.id, email: user.email },
    path: req.url,
    method: req.method,
    action: 'custom_action',
    ok: true,
    status: 200,
    ms: Date.now() - t0,
    meta: { customData: 'value' }
  });
} catch (e) {
  await appendAudit({
    ts: Date.now(),
    ip: clientIp(req),
    path: req.url,
    method: req.method,
    action: 'custom_action',
    ok: false,
    status: 500,
    ms: Date.now() - t0,
    meta: { error: e.message }
  });
}
```

### Storage
- **Location**: `server/logs/audit.json`
- **Format**: JSON with pretty printing
- **Rotation**: Auto-keeps last 10,000 events
- **Backup**: Manual (copy file before rotation)

## Extending to Other Endpoints

### Add Rate Limiting
```typescript
// app/api/sensitive-route/route.ts
import { rateLimitCheck } from '@/lib/rate';

export async function POST(req: NextRequest){
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = rateLimitCheck(`${ip}:POST:/api/sensitive-route`, {
    windowMs: 300_000,  // 5 minutes
    max: 10             // 10 requests
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfterMs: rl.resetMs },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(rl.remaining) } }
    );
  }

  // ... rest of handler
}
```

### Add Audit Logging
```typescript
// app/api/sensitive-route/route.ts
import { appendAudit } from '@/lib/audit';

export async function POST(req: NextRequest){
  const t0 = Date.now();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  try {
    const { data: { user } } = await supa.auth.getUser();

    // ... perform operation

    await appendAudit({
      ts: Date.now(),
      ip,
      user: { id: user?.id, email: user?.email },
      path: '/api/sensitive-route',
      method: 'POST',
      action: 'perform_sensitive_action',
      ok: true,
      status: 200,
      ms: Date.now() - t0,
      meta: { /* custom data */ }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    await appendAudit({
      ts: Date.now(),
      ip,
      path: '/api/sensitive-route',
      method: 'POST',
      action: 'perform_sensitive_action',
      ok: false,
      status: 500,
      ms: Date.now() - t0,
      meta: { error: e.message }
    });

    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
```

## Security Considerations

### Rate Limiting

#### In-Memory Limitations
- Resets on server restart (acceptable for dev/small deployments)
- Not shared across multiple server instances
- Consider Redis for production clusters

#### IP Spoofing Protection
```typescript
// Use multiple IP headers
function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfIp = req.headers.get('cf-connecting-ip');  // Cloudflare

  return cfIp || realIp || forwarded?.split(',')[0]?.trim() || req.ip || 'unknown';
}
```

#### Rate Limit by User ID
```typescript
// More accurate than IP-based
const { data: { user } } = await supa.auth.getUser();
const key = user ? `user:${user.id}` : `ip:${ip}`;
const rl = rateLimitCheck(key, { windowMs: 60_000, max: 30 });
```

### Audit Logging

#### Sensitive Data
- **Never log** passwords, tokens, or API keys
- **Redact** sensitive fields in metadata
- **Hash** identifiable information if necessary

```typescript
await appendAudit({
  // ...
  meta: {
    email: user.email,  // OK
    password: '***',    // REDACTED
    apiKey: hash(apiKey) // HASHED
  }
});
```

#### File System Security
- Ensure `server/logs/` is not publicly accessible
- Add to `.gitignore` if contains real data
- Set appropriate file permissions (chmod 600)

#### Log Rotation
- Current: 10,000 events in memory
- Consider external logging service for production
- Archive old logs before rotation

```bash
# Manual backup
cp server/logs/audit.json server/logs/audit-$(date +%Y%m%d).json
```

## Production Considerations

### Rate Limiting (Distributed)

For production with multiple instances, use Redis:

```typescript
// lib/rate-redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimitCheckRedis(
  identifier: string,
  opt: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
  const key = `ratelimit:${opt.key || identifier}`;
  const now = Date.now();
  const windowStart = now - opt.windowMs;

  // Remove expired entries
  await redis.zremrangebyscore(key, 0, windowStart);

  // Count current requests
  const current = await redis.zcard(key);

  if (current >= opt.max) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetMs = opt.windowMs - (now - Number(oldest[1]));
    return { allowed: false, remaining: 0, resetMs };
  }

  // Add current request
  await redis.zadd(key, now, `${now}:${Math.random()}`);
  await redis.expire(key, Math.ceil(opt.windowMs / 1000));

  return {
    allowed: true,
    remaining: opt.max - current - 1,
    resetMs: opt.windowMs
  };
}
```

### Audit Logging (External Service)

For production, consider external logging:

```typescript
// lib/audit-cloud.ts
import { LoggingWinston } from '@google-cloud/logging-winston';
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new LoggingWinston()  // Google Cloud Logging
  ]
});

export async function appendAuditCloud(ev: AuditEvent) {
  logger.info('audit_event', ev);
}
```

Or use services like:
- **Datadog**: Distributed logging and monitoring
- **Loggly**: Cloud-based log management
- **Sentry**: Error tracking with context
- **Supabase Edge Functions**: Log to Supabase table

### Monitoring

Set up alerts for:
- High rate limit trigger frequency
- Failed authentication attempts
- Suspicious IP patterns
- Error spikes in audit log

```bash
# Example: Alert on >10 rate limits in 1 minute
cat server/logs/audit.json | \
  jq '.events | map(select(.status == 429)) | length'
```

## Troubleshooting

### Rate Limit Not Working
- Check IP extraction logic
- Verify `rateLimitCheck` is called before handler logic
- Ensure buckets Map persists between requests (not recreated)

### Audit Log Not Created
- Check `server/logs/` directory exists and is writable
- Verify `pathe` package is installed
- Check file permissions

### "Forbidden" on /api/audit
- Verify user has `role = 'admin'` in profiles table
- Check Supabase environment variables are set
- Ensure user is authenticated (valid session cookies)

### High Memory Usage
- Reduce audit log retention (change 10,000 to lower number)
- Implement file-based log rotation
- Move to external logging service

## Next Steps

### Add Audit Dashboard
Create admin page to view audit logs with filtering:

```typescript
// app/admin/audit/page.tsx
'use client';
import { useEffect, useState } from 'react';

export default function AuditPage(){
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch('/api/audit?limit=100')
      .then(r => r.json())
      .then(d => setEvents(d.result.events));
  }, []);

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-bold mb-4'>Audit Log</h1>
      <table className='w-full border'>
        <thead>
          <tr>
            <th>Time</th>
            <th>User</th>
            <th>Action</th>
            <th>Status</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e: any) => (
            <tr key={e.ts}>
              <td>{new Date(e.ts).toLocaleString()}</td>
              <td>{e.user?.email || 'Anonymous'}</td>
              <td>{e.action}</td>
              <td>{e.ok ? '✓' : '✗'}</td>
              <td>{e.ms}ms</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Add Rate Limit Dashboard
Show current rate limit status per route:

```typescript
// app/admin/rate-limits/page.tsx
// Display active buckets, remaining capacity, reset times
```

### Webhook Rate Limiting
Apply rate limiting to webhook endpoints:

```typescript
// app/api/webhooks/stripe/route.ts
import { rateLimitCheck } from '@/lib/rate';

export async function POST(req: NextRequest){
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const rl = rateLimitCheck(`${ip}:webhook:stripe`, {
    windowMs: 60_000,
    max: 100  // Stripe webhooks can be frequent
  });

  if (!rl.allowed) {
    return new NextResponse('Rate limited', { status: 429 });
  }

  // ... webhook handler
}
```

## References

- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Sliding Window Rate Limiting](https://www.figma.com/blog/an-alternative-approach-to-rate-limiting/)
- [OWASP Rate Limiting](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
- [Audit Logging Best Practices](https://www.cisecurity.org/insights/white-papers/best-practices-for-privileged-account-management)
