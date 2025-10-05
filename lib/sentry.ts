/**
 * Sentry Error Tracking Configuration
 * Captures exceptions, performance metrics, and user context
 * Phase 3: MONITOR-001
 */

import * as Sentry from '@sentry/nextjs';

// ============================================================
// CONFIGURATION
// ============================================================

export function initSentry() {
  // Only initialise in production or if explicitly enabled
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
    console.warn('Sentry DSN not configured, skipping initialisation');
    return;
  }

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Environment
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

    // Release tracking
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',

    // Performance monitoring
    tracesSampleRate: parseFloat(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || '0.1'),

    // Error sampling
    sampleRate: 1.0, // Capture all errors

    // Profiling (experimental)
    profilesSampleRate: 0.1,

    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.vercel\.app/,
          process.env.NEXT_PUBLIC_SITE_URL || '',
        ],
      }),
      new Sentry.Replay({
        maskAllText: true, // Privacy: mask all text
        blockAllMedia: true, // Privacy: block media
      }),
    ],

    // Replay sampling
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of error sessions

    // Before send hook - scrub sensitive data
    beforeSend(event, hint) {
      return scrubbedEvent(event);
    },

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',

      // Network errors
      'NetworkError',
      'Failed to fetch',

      // Common user errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
    ],
  });
}

// ============================================================
// DATA SCRUBBING
// ============================================================

/**
 * Scrub sensitive data from Sentry events
 * @param event - Sentry event object
 * @returns Scrubbed event
 */
function scrubbedEvent(event: Sentry.Event): Sentry.Event | null {
  // Remove sensitive keys from breadcrumbs
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
      if (breadcrumb.data) {
        breadcrumb.data = scrubbedData(breadcrumb.data);
      }
      return breadcrumb;
    });
  }

  // Remove sensitive keys from request data
  if (event.request?.data) {
    event.request.data = scrubbedData(event.request.data);
  }

  // Remove sensitive keys from extra data
  if (event.extra) {
    event.extra = scrubbedData(event.extra);
  }

  return event;
}

/**
 * Recursively scrub sensitive keys
 */
function scrubbedData(data: any): any {
  const sensitiveKeys = [
    'password',
    'secret',
    'token',
    'api_key',
    'apiKey',
    'access_token',
    'accessToken',
    'refresh_token',
    'refreshToken',
    'authorization',
    'cookie',
    'session',
    'credit_card',
    'creditCard',
    'ssn',
    'cvv',
  ];

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const scrubbed = Array.isArray(data) ? [...data] : { ...data };

  for (const key in scrubbed) {
    // Check if key is sensitive
    const isSensitive = sensitiveKeys.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof scrubbed[key] === 'object') {
      scrubbed[key] = scrubbedData(scrubbed[key]);
    }
  }

  return scrubbed;
}

// ============================================================
// USER CONTEXT
// ============================================================

/**
 * Set user context for Sentry
 * @param userId - User ID
 * @param email - User email (optional, will be scrubbed)
 * @param organisationId - Organisation ID
 */
export function setSentryUser(userId: string, email?: string, organisationId?: string) {
  Sentry.setUser({
    id: userId,
    email: email ? maskEmail(email) : undefined,
    organisationId,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser() {
  Sentry.setUser(null);
}

/**
 * Mask email for privacy (keep domain visible)
 * Example: john.doe@example.com -> j***@example.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;

  const maskedLocal = local.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}

// ============================================================
// CUSTOM TAGS & CONTEXT
// ============================================================

/**
 * Set organisation context
 */
export function setSentryOrganisation(organisationId: string, organisationName: string) {
  Sentry.setTag('organisation_id', organisationId);
  Sentry.setContext('organisation', {
    id: organisationId,
    name: organisationName,
  });
}

/**
 * Set feature flag context
 */
export function setSentryFeatureFlags(flags: Record<string, boolean>) {
  Sentry.setContext('feature_flags', flags);
}

// ============================================================
// MANUAL ERROR CAPTURE
// ============================================================

/**
 * Capture exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context ? scrubbedData(context) : undefined,
  });
}

/**
 * Capture message (for warnings/info)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
  Sentry.captureMessage(message, {
    level,
    extra: context ? scrubbedData(context) : undefined,
  });
}

// ============================================================
// PERFORMANCE MONITORING
// ============================================================

/**
 * Start a transaction for performance monitoring
 * @param name - Transaction name
 * @param op - Operation type (e.g., 'http.request', 'db.query')
 * @returns Transaction object
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Measure async operation performance
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const transaction = startTransaction(name, 'function');

  try {
    const result = await operation();
    transaction.setStatus('ok');
    return result;
  } catch (error) {
    transaction.setStatus('internal_error');
    throw error;
  } finally {
    transaction.finish();
  }
}
