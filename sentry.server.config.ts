/**
 * Sentry Server-Side Configuration
 * This file configures Sentry for server-side errors (API routes, SSR)
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Server-side integrations
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  beforeSend(event, hint) {
    // Remove sensitive server-side data
    if (event.request) {
      // Remove authorization headers
      if (event.request.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive environment variables from context
      if (event.contexts?.runtime?.env) {
        const sensitiveKeys = [
          'ANTHROPIC_API_KEY',
          'OPENAI_API_KEY',
          'SEMRUSH_API_KEY',
          'POSTGRES_URL',
          'DATABASE_PASSWORD',
          'SENTRY_AUTH_TOKEN',
        ];

        sensitiveKeys.forEach((key) => {
          if (event.contexts?.runtime?.env?.[key]) {
            event.contexts.runtime.env[key] = '[REDACTED]';
          }
        });
      }
    }

    return event;
  },
});
