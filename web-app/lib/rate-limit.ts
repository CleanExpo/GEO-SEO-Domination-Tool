import { NextRequest } from 'next/server';

interface RateLimitConfig {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max requests per window
}

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store for rate limiting (use Redis in production)
const tokenStore = new Map<string, TokenBucket>();

/**
 * Rate limiting using token bucket algorithm
 * @param request - Next.js request object
 * @param config - Rate limit configuration
 * @returns Object with limited flag and remaining tokens
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 }
): Promise<{ limited: boolean; remaining: number; reset: number }> {
  // Get identifier from IP or user ID
  const identifier =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'anonymous';

  const now = Date.now();
  const bucket = tokenStore.get(identifier);

  if (!bucket) {
    // First request from this identifier
    tokenStore.set(identifier, {
      tokens: config.uniqueTokenPerInterval - 1,
      lastRefill: now,
    });
    return {
      limited: false,
      remaining: config.uniqueTokenPerInterval - 1,
      reset: now + config.interval
    };
  }

  // Calculate how many tokens to refill based on time passed
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(
    (timePassed / config.interval) * config.uniqueTokenPerInterval
  );

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(
      config.uniqueTokenPerInterval,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;
  }

  // Check if we have tokens available
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return {
      limited: false,
      remaining: bucket.tokens,
      reset: bucket.lastRefill + config.interval
    };
  }

  // Rate limit exceeded
  return {
    limited: true,
    remaining: 0,
    reset: bucket.lastRefill + config.interval
  };
}

/**
 * Clean up old entries from token store (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour

  for (const [key, bucket] of tokenStore.entries()) {
    if (now - bucket.lastRefill > maxAge) {
      tokenStore.delete(key);
    }
  }
}

// Clean up every hour
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 3600000);
}

/**
 * Preset configurations for common rate limiting scenarios
 */
export const RateLimitPresets = {
  // 10 requests per minute
  standard: { interval: 60000, uniqueTokenPerInterval: 10 },

  // 100 requests per minute
  generous: { interval: 60000, uniqueTokenPerInterval: 100 },

  // 5 requests per minute (strict, for auth endpoints)
  strict: { interval: 60000, uniqueTokenPerInterval: 5 },

  // 1000 requests per minute (for internal APIs)
  internal: { interval: 60000, uniqueTokenPerInterval: 1000 },
};
