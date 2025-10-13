import { validateEnvironment } from '@/lib/env-validator';

export async function register() {
  // Validate environment variables at startup
  const validation = validateEnvironment();

  if (!validation.valid) {
    console.error('[INSTRUMENTATION] Environment validation failed!');
    // Don't block startup, but log prominently
  }

  // Initialize Sentry if DSN is configured
  if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
      await import('./sentry.edge.config');
    }
  }
}
