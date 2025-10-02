# Rate Limiting Implementation Guide

## Overview

This application uses a flexible rate limiting system to prevent API abuse and ensure fair usage. Rate limits are enforced on API routes using middleware.

## How It Works

### In-Memory Store (Development)
- Rate limit data is stored in memory using a `Map`
- Automatically cleans up expired records every 5 minutes
- **Note:** In-memory store resets when the server restarts

### Production Recommendation
For production deployments, replace the in-memory store with **Redis** or **Upstash** for:
- Persistent rate limit tracking across server restarts
- Distributed rate limiting across multiple instances
- Better performance at scale

## Client Identification

The rate limiter identifies clients by:

1. **User ID** (preferred) - Extracted from JWT authorization header
2. **IP Address** (fallback) - From `x-forwarded-for` or `x-real-ip` headers

## Usage Examples

### Basic Usage

```typescript
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withRateLimit(
  async (req: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ message: 'Success' })
  },
  RateLimitPresets.standard // 100 requests per 15 minutes
)
```

### Using Different Presets

```typescript
// Strict rate limiting (10 requests per minute)
export const POST = withRateLimit(handler, RateLimitPresets.strict)

// Auth endpoints (5 attempts per 15 minutes)
export const POST = withRateLimit(loginHandler, RateLimitPresets.auth)

// Search endpoints (20 requests per minute)
export const GET = withRateLimit(searchHandler, RateLimitPresets.search)

// API endpoints (50 requests per minute)
export const GET = withRateLimit(apiHandler, RateLimitPresets.api)

// Relaxed (1000 requests per hour)
export const GET = withRateLimit(handler, RateLimitPresets.relaxed)
```

### Custom Configuration

```typescript
export const POST = withRateLimit(
  async (req: NextRequest) => {
    // Your API logic
    return NextResponse.json({ message: 'Success' })
  },
  {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 25, // 25 requests
    message: 'Custom rate limit message',
  }
)
```

### Advanced Usage

```typescript
import { rateLimit } from '@/lib/middleware/rate-limiter'
import { asyncHandler } from '@/lib/middleware/api-error-handler'

export const POST = async (req: NextRequest) => {
  // Apply rate limiting
  const rateLimitResponse = await rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 10,
  })(req, async (req) => {
    // Wrap with error handler
    return asyncHandler(async (req) => {
      // Your API logic
      const data = await req.json()

      // Process request
      return NextResponse.json({ success: true })
    })(req)
  })

  return rateLimitResponse
}
```

## Rate Limit Presets

### `RateLimitPresets.strict`
- **Limit:** 10 requests per minute
- **Use case:** Sensitive operations, admin endpoints

### `RateLimitPresets.standard`
- **Limit:** 100 requests per 15 minutes
- **Use case:** Default for most API routes

### `RateLimitPresets.relaxed`
- **Limit:** 1000 requests per hour
- **Use case:** Public endpoints, read-only operations

### `RateLimitPresets.auth`
- **Limit:** 5 attempts per 15 minutes
- **Use case:** Login, signup, password reset

### `RateLimitPresets.api`
- **Limit:** 50 requests per minute
- **Use case:** API endpoints with moderate usage

### `RateLimitPresets.search`
- **Limit:** 20 requests per minute
- **Use case:** Search and filter endpoints

## Response Headers

All rate-limited endpoints include these headers:

```
X-RateLimit-Limit: 100          # Maximum requests allowed
X-RateLimit-Remaining: 87       # Requests remaining in window
X-RateLimit-Reset: 2024-01-15T10:30:00.000Z  # When the limit resets
```

When rate limit is exceeded:

```
Retry-After: 120                # Seconds until limit resets
```

## Error Response

When rate limit is exceeded, the API returns:

```json
{
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "statusCode": 429,
    "retryAfter": 120
  }
}
```

HTTP Status: **429 Too Many Requests**

## Applying Rate Limits to Existing Routes

### Example: Companies API

```typescript
// app/api/companies/route.ts
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter'
import { asyncHandler } from '@/lib/middleware/api-error-handler'
import { NextRequest, NextResponse } from 'next/server'

export const GET = withRateLimit(
  asyncHandler(async (req: NextRequest) => {
    // Your existing logic
    const companies = await fetchCompanies()
    return NextResponse.json(companies)
  }),
  RateLimitPresets.api
)

export const POST = withRateLimit(
  asyncHandler(async (req: NextRequest) => {
    // Your existing logic
    const data = await req.json()
    const company = await createCompany(data)
    return NextResponse.json(company)
  }),
  RateLimitPresets.strict // More restrictive for write operations
)
```

### Example: Auth Routes

```typescript
// app/api/auth/login/route.ts
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter'

export const POST = withRateLimit(
  async (req: NextRequest) => {
    const { email, password } = await req.json()

    // Perform authentication
    const result = await authenticate(email, password)

    return NextResponse.json(result)
  },
  RateLimitPresets.auth // 5 attempts per 15 minutes
)
```

### Example: Search Endpoints

```typescript
// app/api/search/route.ts
import { withRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limiter'

export const GET = withRateLimit(
  async (req: NextRequest) => {
    const query = req.nextUrl.searchParams.get('q')
    const results = await performSearch(query)

    return NextResponse.json(results)
  },
  RateLimitPresets.search // 20 requests per minute
)
```

## Upgrading to Redis (Production)

### Install Redis Client

```bash
npm install ioredis
```

### Update Rate Limiter

```typescript
// lib/middleware/rate-limiter.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

async function isRateLimited(clientId: string, config: RateLimitConfig): Promise<boolean> {
  const key = `rate-limit:${clientId}`
  const now = Date.now()

  const [count, ttl] = await redis
    .multi()
    .incr(key)
    .pexpire(key, config.windowMs)
    .exec()

  const requestCount = count[1] as number

  if (requestCount > config.maxRequests) {
    return true
  }

  return false
}
```

### Using Upstash (Serverless Redis)

```bash
npm install @upstash/redis
```

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Use same logic as above with Upstash client
```

## Testing Rate Limits

### Manual Testing

```bash
# Make multiple requests to test rate limiting
for i in {1..15}; do
  curl -X GET http://localhost:3000/api/companies \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -w "\nStatus: %{http_code}\n"
  sleep 1
done
```

### Automated Testing

```typescript
// __tests__/rate-limit.test.ts
import { GET } from '@/app/api/companies/route'
import { NextRequest } from 'next/server'

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    const req = new NextRequest('http://localhost:3000/api/companies')
    const res = await GET(req)
    expect(res.status).toBe(200)
  })

  it('should block requests exceeding limit', async () => {
    const req = new NextRequest('http://localhost:3000/api/companies')

    // Make requests up to the limit
    for (let i = 0; i < 100; i++) {
      await GET(req)
    }

    // Next request should be blocked
    const res = await GET(req)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBeTruthy()
  })
})
```

## Best Practices

### ✅ DO:
- Use stricter limits for write operations (POST, PUT, DELETE)
- Use `auth` preset for authentication endpoints
- Add rate limiting to all public API routes
- Monitor rate limit metrics in production
- Upgrade to Redis/Upstash for production
- Use user-based limiting when possible (more accurate than IP)

### ❌ DON'T:
- Use the same limit for all endpoints
- Rely on in-memory store in production
- Forget to handle 429 responses in frontend
- Set limits too low (frustrates users)
- Set limits too high (allows abuse)

## Monitoring Rate Limits

### Log Rate Limit Events

```typescript
export function withRateLimit(handler, config) {
  return async (req: NextRequest, context?: any) => {
    const clientId = getClientId(req)

    const response = await rateLimit(config)(req, () => handler(req, context))

    // Log if rate limited
    if (response.status === 429) {
      console.warn('[RATE_LIMIT] Client exceeded limit', {
        clientId,
        path: req.nextUrl.pathname,
        limit: config.maxRequests,
        window: config.windowMs,
      })
    }

    return response
  }
}
```

### Integrate with Analytics

```typescript
import { analytics } from '@/lib/analytics'

if (response.status === 429) {
  analytics.track('rate_limit_exceeded', {
    clientId,
    path: req.nextUrl.pathname,
    method: req.method,
  })
}
```

## Troubleshooting

### "Rate limit exceeded" but I haven't made many requests
- Check if you're sharing an IP with other users (NAT, proxy)
- Clear rate limit cache: restart dev server or clear Redis
- Check if client ID detection is working correctly

### Rate limiting not working
- Ensure middleware is applied correctly with `withRateLimit()`
- Check that `windowMs` and `maxRequests` are set properly
- Verify headers are being sent correctly

### Rate limits reset unexpectedly
- In-memory store is cleared on server restart (expected in development)
- Use Redis/Upstash for persistent rate limiting in production
