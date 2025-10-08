/**
 * Sentry Configuration for GEO-SEO Domination Tool
 * Error tracking, performance monitoring, and release tracking
 */

import * as Sentry from '@sentry/nextjs';

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;
export const SENTRY_ORG = process.env.SENTRY_ORG;
export const SENTRY_PROJECT = process.env.SENTRY_PROJECT;

export const SENTRY_CONFIG = {
  dsn: SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session Replay (optional, uses quota)
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Additional options
  debug: process.env.NODE_ENV === 'development',

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',

    // Network errors
    'NetworkError',
    'Non-Error promise rejection captured',

    // Common third-party errors
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  // Breadcrumbs for better debugging
  beforeBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    // Don't log sensitive data
    if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
      return null;
    }
    return breadcrumb;
  },

  // Sanitize sensitive data before sending
  beforeSend(event: Sentry.Event, hint: Sentry.EventHint) {
    // Remove sensitive data from errors
    if (event.request) {
      // Remove API keys from headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Remove sensitive query params
      if (event.request.query_string) {
        const sanitized = event.request.query_string
          .replace(/api_key=[^&]*/gi, 'api_key=[REDACTED]')
          .replace(/token=[^&]*/gi, 'token=[REDACTED]')
          .replace(/password=[^&]*/gi, 'password=[REDACTED]');
        event.request.query_string = sanitized;
      }
    }

    return event;
  },

  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/.*\.vercel\.app/,
        /^https:\/\/.*\.yourdomain\.com/,
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
};

/**
 * Initialize Sentry (call this in app initialization)
 */
export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('⚠️ Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init(SENTRY_CONFIG);

  console.log('✓ Sentry initialized');
}

/**
 * Capture custom error with context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: Sentry.SeverityLevel;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureException(error);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  companyId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    company_id: user.companyId,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Track custom events
 */
export function trackEvent(
  eventName: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category: 'custom',
    message: eventName,
    level: 'info',
    data,
  });
}

/**
 * Start performance transaction
 */
export function startTransaction(
  name: string,
  operation: string
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op: operation,
  });
}

/**
 * Track API call performance
 */
export async function trackAPICall<T>(
  apiName: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(apiName, 'api.call');

  try {
    const result = await apiCall();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    captureError(error as Error, {
      tags: { api: apiName },
      level: 'error',
    });
    throw error;
  } finally {
    transaction.finish();
  }
}
