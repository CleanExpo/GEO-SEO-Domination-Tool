import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum number of requests per window
  message?: string // Custom error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

interface RequestRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RequestRecord>()

/**
 * Get the client identifier (IP address or user ID)
 */
function getClientId(request: NextRequest): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    // Extract user ID from JWT if available
    try {
      const token = authHeader.replace('Bearer ', '')
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.sub) {
        return `user:${payload.sub}`
      }
    } catch {
      // Invalid token, fall through to IP-based limiting
    }
  }

  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

/**
 * Check if client has exceeded rate limit
 */
function isRateLimited(clientId: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(clientId)

  // No previous record - allow request
  if (!record) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return false
  }

  // Reset time has passed - start new window
  if (now > record.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return false
  }

  // Within window - check if limit exceeded
  if (record.count >= config.maxRequests) {
    return true
  }

  // Increment count
  record.count++
  rateLimitStore.set(clientId, record)
  return false
}

/**
 * Get remaining requests and reset time for a client
 */
function getRateLimitInfo(clientId: string, config: RateLimitConfig) {
  const record = rateLimitStore.get(clientId)
  const now = Date.now()

  if (!record || now > record.resetTime) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    }
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetTime: record.resetTime,
  }
}

/**
 * Clean up expired records (run periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

// Run cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Rate limiting middleware factory
 * @param config Rate limit configuration
 * @returns Middleware function that enforces rate limiting
 */
export function rateLimit(config: RateLimitConfig) {
  return async (
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const clientId = getClientId(request)

    // Check if client is rate limited
    if (isRateLimited(clientId, config)) {
      const info = getRateLimitInfo(clientId, config)
      const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000)

      return NextResponse.json(
        {
          error: {
            message:
              config.message ||
              'Too many requests. Please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            statusCode: 429,
            retryAfter,
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(info.resetTime).toISOString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      )
    }

    // Execute the handler
    const response = await handler(request)

    // Add rate limit headers to response
    const info = getRateLimitInfo(clientId, config)
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(info.resetTime).toISOString())

    return response
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many requests. Maximum 10 requests per minute allowed.',
  },

  // Standard: 100 requests per 15 minutes
  standard: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    message: 'Too many requests. Maximum 100 requests per 15 minutes allowed.',
  },

  // Relaxed: 1000 requests per hour
  relaxed: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 1000,
    message: 'Too many requests. Maximum 1000 requests per hour allowed.',
  },

  // Auth: 5 login attempts per 15 minutes
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message:
      'Too many login attempts. Please try again in 15 minutes.',
  },

  // API: 50 requests per minute
  api: {
    windowMs: 60 * 1000,
    maxRequests: 50,
    message: 'API rate limit exceeded. Maximum 50 requests per minute.',
  },

  // Search: 20 requests per minute
  search: {
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Search rate limit exceeded. Maximum 20 searches per minute.',
  },
} as const

/**
 * Helper to create rate-limited API route
 * @param handler The API route handler
 * @param config Rate limit configuration
 */
export function withRateLimit(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig = RateLimitPresets.standard
) {
  return async (req: NextRequest, context?: any) => {
    return rateLimit(config)(req, () => handler(req, context))
  }
}
