/**
 * Simple in-memory rate limiter for API endpoints
 *
 * Usage:
 * ```typescript
 * import { rateLimiter } from '@/lib/rate-limiter';
 *
 * const limiter = rateLimiter({
 *   interval: 60 * 1000, // 1 minute
 *   maxRequests: 10, // 10 requests per minute
 * });
 *
 * if (!limiter.check(userId)) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * ```
 */

interface RateLimiterOptions {
  interval: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per interval
  keyPrefix?: string; // Optional prefix for different limiters
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RequestRecord>();

// Cleanup old records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function rateLimiter(options: RateLimiterOptions) {
  const { interval, maxRequests, keyPrefix = 'default' } = options;

  return {
    check(identifier: string): boolean {
      const key = `${keyPrefix}:${identifier}`;
      const now = Date.now();
      const record = store.get(key);

      if (!record || record.resetTime < now) {
        // Create new record
        store.set(key, {
          count: 1,
          resetTime: now + interval,
        });
        return true;
      }

      if (record.count >= maxRequests) {
        return false; // Rate limit exceeded
      }

      // Increment count
      record.count++;
      store.set(key, record);
      return true;
    },

    reset(identifier: string): void {
      const key = `${keyPrefix}:${identifier}`;
      store.delete(key);
    },

    getInfo(identifier: string): { remaining: number; resetTime: number } | null {
      const key = `${keyPrefix}:${identifier}`;
      const record = store.get(key);
      const now = Date.now();

      if (!record || record.resetTime < now) {
        return {
          remaining: maxRequests,
          resetTime: now + interval,
        };
      }

      return {
        remaining: Math.max(0, maxRequests - record.count),
        resetTime: record.resetTime,
      };
    },
  };
}

// Predefined limiters for different endpoints
export const auditLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 5, // 5 audits per minute per company
  keyPrefix: 'audit',
});

export const comprehensiveAuditLimiter = rateLimiter({
  interval: 5 * 60 * 1000, // 5 minutes
  maxRequests: 2, // 2 comprehensive audits per 5 minutes
  keyPrefix: 'comprehensive-audit',
});

export const webhookLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 webhook calls per minute
  keyPrefix: 'webhook',
});

export const apiLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 API calls per minute
  keyPrefix: 'api',
});
