# E2E Audit - Phase 2 Execution Plan

**Branch:** E2E-Audit
**Start Date:** 2025-10-09
**Duration:** Week 2-3 (32 hours)
**Goal:** Fix Critical Issues + Performance Optimization

---

## Phase 2.1: Install Sentry for Structured Logging (2h)

### Status: 🟢 In Progress

**Installation:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration Files:**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- `next.config.js` (Sentry webpack plugin)

**Environment Variables:**
```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
```

**Benefits:**
- Error tracking with stack traces
- Performance monitoring
- User context and breadcrumbs
- Release tracking
- Replaces 742 console.log statements

---

## Phase 2.2: Environment Validation (2h)

### Status: ✅ Complete

**Created:** `lib/env-validation.ts`

**Features:**
- Validates 25+ environment variables
- Custom validators (URL format, key length)
- Clear error messages with descriptions
- Development warnings for optional vars
- Auto-validation on startup

**Integration Points:**
```typescript
// middleware.ts or app/layout.tsx
import { validateEnv } from '@/lib/env-validation';

if (process.env.NODE_ENV === 'production') {
  validateEnv(); // Throws on missing required vars
}
```

---

## Phase 2.3: Fix npm Audit Vulnerabilities (4h)

### Status: 🟢 In Progress

**Found:** 5 vulnerabilities (3 moderate, 2 critical)

**Remediation Steps:**
1. ✅ Run `npm audit fix --legacy-peer-deps`
2. ⏳ Review dependency updates
3. ⏳ Test for breaking changes
4. ⏳ Run `npm audit` again to verify fixes
5. ⏳ Document any remaining unfixable vulnerabilities

**Success Criteria:**
- 0 critical vulnerabilities
- <3 moderate vulnerabilities
- All high-severity issues addressed

---

## Phase 2.4: Begin Console.log Replacement (8h)

### Target: Replace 742 console statements

**Priority Order:**
1. **Critical Error Handling** (100 console.error) - 2h
   - Services layer error catching
   - API route error responses
   - Database connection failures

2. **Security-Sensitive Logging** (~50 statements) - 2h
   - Authentication flows
   - API key validation
   - Webhook processing

3. **User-Facing Errors** (~100 statements) - 2h
   - Component error boundaries
   - Form validation errors
   - Network request failures

4. **Debug Logging** (~492 console.log) - 2h
   - Service method calls
   - API request/response logging
   - State changes

**Implementation Pattern:**
```typescript
// Before
console.error('API error:', error);
console.log('Fetching company:', companyId);

// After
import * as Sentry from '@sentry/nextjs';

Sentry.captureException(error, {
  tags: { feature: 'api', endpoint: '/companies' },
  contexts: { company: { id: companyId } }
});

Sentry.addBreadcrumb({
  category: 'api',
  message: 'Fetching company',
  data: { companyId },
  level: 'info'
});
```

---

## Phase 2.5: Migrate Rate Limiting to Redis (6h)

### Status: ⏳ Planned

**Current Issue:**
- `lib/rateLimit.ts` uses in-memory Map
- Breaks in serverless (cold starts reset limits)
- Doesn't work across multiple instances

**Solution: Upstash Redis**

### Step 1: Setup Upstash (30min)
1. Create account at upstash.com
2. Create Redis database
3. Get REST URL and token
4. Add to environment variables

### Step 2: Install Dependencies (15min)
```bash
npm install @upstash/redis
```

### Step 3: Create New Rate Limiter (2h)
```typescript
// lib/rate-limit-redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export interface RateLimitConfig {
  uniqueTokenPerInterval: number;
  interval: number; // milliseconds
}

export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{ limited: boolean; remaining: number; reset: number }> {
  const key = `rate-limit:${identifier}`;
  const windowDuration = Math.floor(config.interval / 1000);

  // Increment counter
  const count = await redis.incr(key);

  // Set expiry on first request in window
  if (count === 1) {
    await redis.expire(key, windowDuration);
  }

  // Get TTL for reset timestamp
  const ttl = await redis.ttl(key);
  const reset = Date.now() + (ttl * 1000);

  return {
    limited: count > config.uniqueTokenPerInterval,
    remaining: Math.max(0, config.uniqueTokenPerInterval - count),
    reset,
  };
}
```

### Step 4: Update All Usage Sites (2h)
- Find all imports of `lib/rateLimit.ts`
- Update to use `lib/rate-limit-redis.ts`
- Update to handle async rate limiting
- Test with rate limit scenarios

### Step 5: Remove Old Implementation (30min)
- Delete `lib/rateLimit.ts`
- Verify no broken imports
- Update tests

### Step 6: Testing (1h)
- Test rate limiting works across requests
- Test cold start behavior
- Test multiple concurrent users
- Verify Redis key expiration

---

## Phase 2.6: Fix eval() Vulnerability (2h)

### Status: ⏳ Planned

**File:** `services/browser-automation.ts`

**Current (Dangerous):**
```typescript
await page.evaluate(`window.${userInput}()`);
```

**Fixed (Safe):**
```typescript
await page.evaluate((fn) => {
  if (typeof window[fn] === 'function') {
    window[fn]();
  }
}, userInput);
```

**Additional Mitigations:**
1. Add input validation
2. Whitelist allowed function names
3. Add CSP headers (already done ✅)
4. Audit all dynamic code execution

---

## Phase 2.7: Implement Response Caching (8h)

### Status: ⏳ Planned

**Benefits:**
- Reduce API calls to SEMrush, Claude, etc.
- Faster response times
- Lower costs
- Better UX

**Implementation:**

### Step 1: Install Upstash Redis (if not done)
Same Redis instance can be used for both rate limiting and caching.

### Step 2: Create Cache Utility (2h)
```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 3600 // 1 hour default
): Promise<T> {
  // Try to get from cache
  const cached = await redis.get(key);
  if (cached) {
    return cached as T;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data));

  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

### Step 3: Add Caching to API Routes (4h)
```typescript
// app/api/integrations/semrush/keywords/route.ts
import { getCached } from '@/lib/cache';

export async function GET(request: Request) {
  const { domain } = await request.json();

  const keywords = await getCached(
    `semrush:keywords:${domain}`,
    async () => {
      return await fetchSEMrushKeywords(domain);
    },
    3600 // 1 hour cache
  );

  return Response.json(keywords);
}
```

### Step 4: Cache Strategy by Resource (2h)
- **SEMrush data:** 1 hour
- **Lighthouse audits:** 24 hours
- **Company data:** 5 minutes
- **Ranking data:** 1 hour
- **AI responses:** 30 minutes

---

## Phase 2.8: Add CORS Configuration (1h)

### Status: ⏳ Planned

**File:** `middleware.ts`

**Implementation:**
```typescript
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add CORS headers
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://geo-seo-domination-tool.vercel.app',
    'https://geo-seo-domination-tool-git-main-unite-group.vercel.app',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    response.headers.set('Access-Control-Max-Age', '86400');
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: response.headers });
  }

  return response;
}
```

---

## Success Metrics

### After Phase 2 (Target)

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Health Score** | 68/100 | 78/100 | +10 points |
| **Security** | 48/100 | 70/100 | +22 points |
| **Performance** | 65/100 | 78/100 | +13 points |
| **Observability** | 40/100 | 70/100 | +30 points |

### Specific Improvements
- ✅ Environment validation prevents startup crashes
- ✅ Sentry tracking for 742 console statements
- ✅ npm vulnerabilities reduced to <3
- ✅ Redis rate limiting works in serverless
- ✅ eval() vulnerability fixed
- ✅ Response caching reduces API calls by 60%
- ✅ CORS properly configured

---

## Timeline

| Task | Duration | Status |
|------|----------|--------|
| 2.1 Install Sentry | 2h | 🟢 In Progress |
| 2.2 Env Validation | 2h | ✅ Complete |
| 2.3 npm Audit Fix | 4h | 🟢 In Progress |
| 2.4 Replace console.log | 8h | ⏳ Pending |
| 2.5 Redis Rate Limit | 6h | ⏳ Pending |
| 2.6 Fix eval() | 2h | ⏳ Pending |
| 2.7 Response Caching | 8h | ⏳ Pending |
| 2.8 CORS Config | 1h | ⏳ Pending |
| **TOTAL** | **33h** | **12% Complete** |

---

## Next Steps

1. ⏳ Complete Sentry installation
2. ⏳ Finish npm audit fixes
3. ⏳ Begin console.log replacement
4. ⏳ Set up Upstash Redis
5. ⏳ Migrate rate limiting
6. ⏳ Implement caching

**Phase 2 Target Completion:** Week 2-3 of audit
