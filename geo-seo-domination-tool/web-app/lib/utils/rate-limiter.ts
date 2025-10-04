/**
 * Rate Limiting Utility
 * Implements rate limiting for API endpoints and external service calls
 */

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory rate limiter (for development)
 * In production, consider using Redis for distributed rate limiting
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   */
  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const prefixedKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

    const existing = this.requests.get(prefixedKey);

    // No existing record or expired
    if (!existing || existing.resetAt < now) {
      const resetAt = now + config.windowMs;
      this.requests.set(prefixedKey, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (existing.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: existing.resetAt,
      };
    }

    // Increment count
    existing.count++;
    this.requests.set(prefixedKey, existing);

    return {
      allowed: true,
      remaining: config.maxRequests - existing.count,
      resetAt: existing.resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string, prefix?: string): void {
    const prefixedKey = prefix ? `${prefix}:${key}` : key;
    this.requests.delete(prefixedKey);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.requests.entries()) {
      if (value.resetAt < now) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Destroy rate limiter
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Rate limit configurations
export const RateLimitConfigs = {
  // API endpoints
  api: {
    windowMs: 60000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyPrefix: 'api',
  },

  // Authentication endpoints (stricter)
  auth: {
    windowMs: 900000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    keyPrefix: 'auth',
  },

  // Google PageSpeed API (very strict - Google has limits)
  lighthouse: {
    windowMs: 60000, // 1 minute
    maxRequests: 2, // 2 requests per minute
    keyPrefix: 'lighthouse',
  },

  // Firecrawl API
  firecrawl: {
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
    keyPrefix: 'firecrawl',
  },

  // Anthropic Claude API
  anthropic: {
    windowMs: 60000, // 1 minute
    maxRequests: 50, // 50 requests per minute
    keyPrefix: 'anthropic',
  },

  // Ranking checks (to avoid being blocked by search engines)
  rankingCheck: {
    windowMs: 300000, // 5 minutes
    maxRequests: 10, // 10 checks per 5 minutes
    keyPrefix: 'ranking',
  },
};

export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware helper
 */
export function createRateLimitCheck(config: RateLimitConfig) {
  return (identifier: string): RateLimitResult => {
    return rateLimiter.check(identifier, config);
  };
}

/**
 * Get client identifier from request
 * Uses IP address or user ID
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Rate limit decorator for async functions
 */
export function rateLimit(config: RateLimitConfig) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Extract identifier from first argument or use 'default'
      const identifier = args[0]?.identifier || 'default';

      const result = rateLimiter.check(identifier, config);

      if (!result.allowed) {
        throw new Error(
          `Rate limit exceeded. Try again in ${Math.ceil(
            (result.resetAt - Date.now()) / 1000
          )} seconds.`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
