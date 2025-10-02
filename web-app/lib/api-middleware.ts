import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { rateLimit, RateLimitPresets } from './rate-limit';
import { rateLimitError, authError, serverError } from './api-response';
import { logger } from './logger';

/**
 * API Middleware configuration
 */
export interface ApiMiddlewareConfig {
  requireAuth?: boolean;
  rateLimit?: {
    interval: number;
    uniqueTokenPerInterval: number;
  };
  logRequests?: boolean;
}

/**
 * Context object passed to API handlers
 */
export interface ApiContext {
  user: {
    id: string;
    email?: string;
  } | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
  request: NextRequest;
}

/**
 * Wrapper function that applies middleware to API routes
 *
 * Usage:
 * ```typescript
 * export const GET = withApiMiddleware(
 *   async (context) => {
 *     // Your handler logic
 *     return { data: 'success' };
 *   },
 *   { requireAuth: true, rateLimit: RateLimitPresets.standard }
 * );
 * ```
 */
export function withApiMiddleware<T>(
  handler: (context: ApiContext) => Promise<T>,
  config: ApiMiddlewareConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      // 1. Rate limiting (if configured)
      if (config.rateLimit) {
        const rateLimitResult = await rateLimit(request, config.rateLimit);

        if (rateLimitResult.limited) {
          logger.warn('Rate limit exceeded', {
            path,
            method,
            reset: rateLimitResult.reset,
          });

          return rateLimitError(rateLimitResult.reset - Date.now());
        }

        // Add rate limit headers
        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.reset).toISOString());
      }

      // 2. Create Supabase client
      const supabase = await createClient();

      // 3. Check authentication (if required)
      let user = null;
      if (config.requireAuth || config.requireAuth === undefined) {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          logger.warn('Authentication required', { path, method });
          return authError('Authentication required');
        }

        user = authUser;
      } else {
        // Try to get user even if not required
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
      }

      // 4. Create context
      const context: ApiContext = {
        user: user ? { id: user.id, email: user.email } : null,
        supabase,
        request,
      };

      // 5. Log request (if configured)
      if (config.logRequests !== false) {
        logger.info('API Request', {
          method,
          path,
          userId: user?.id,
        });
      }

      // 6. Execute handler
      const result = await handler(context);

      // 7. Log response time
      const duration = Date.now() - startTime;
      logger.debug('API Response', {
        method,
        path,
        duration: `${duration}ms`,
        userId: user?.id,
      });

      // 8. Return success response
      return NextResponse.json(result);
    } catch (error) {
      // Log error
      const duration = Date.now() - startTime;
      logger.error('API Error', error as Error, {
        method,
        path,
        duration: `${duration}ms`,
      });

      // Return error response
      return serverError(error as Error);
    }
  };
}

/**
 * Preset configurations for common API patterns
 */
export const ApiMiddlewarePresets = {
  // Public endpoint (no auth, standard rate limit)
  public: {
    requireAuth: false,
    rateLimit: RateLimitPresets.standard,
  },

  // Protected endpoint (auth required, standard rate limit)
  protected: {
    requireAuth: true,
    rateLimit: RateLimitPresets.standard,
  },

  // Auth endpoints (no auth required, strict rate limit)
  auth: {
    requireAuth: false,
    rateLimit: RateLimitPresets.strict,
  },

  // Internal endpoints (auth required, generous rate limit)
  internal: {
    requireAuth: true,
    rateLimit: RateLimitPresets.generous,
  },
};
