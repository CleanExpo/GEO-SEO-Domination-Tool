export async function register() {
  // Temporarily disable Sentry to fix Html import error during App Router builds
  // TODO: Re-enable after upgrading to Sentry Next.js SDK v9+ with better App Router support

  // if (process.env.NEXT_RUNTIME === 'nodejs') {
  //   await import('./sentry.server.config');
  // }

  // if (process.env.NEXT_RUNTIME === 'edge') {
  //   await import('./sentry.edge.config');
  // }
}
