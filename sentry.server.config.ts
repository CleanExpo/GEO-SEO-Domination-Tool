import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development',
  release: process.env.NEXT_PUBLIC_RELEASE_VERSION,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable profiling
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Server-specific integrations
  integrations: [
    Sentry.httpIntegration({
      tracing: true,
      breadcrumbs: true,
    }),
  ],

  // Error filtering
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException as Error | undefined;

      // Don't send expected 404s
      if (error?.message?.includes('404')) {
        return null;
      }

      // Don't send expected auth redirects
      if (error?.message?.includes('NEXT_REDIRECT')) {
        return null;
      }
    }

    return event;
  },

  // Breadcrumb filtering
  beforeBreadcrumb(breadcrumb, hint) {
    // Don't send breadcrumbs for health checks
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/health')) {
      return null;
    }

    // Don't send breadcrumbs for static assets
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.match(/\.(js|css|png|jpg|svg|woff2?)$/)) {
      return null;
    }

    return breadcrumb;
  },
});
