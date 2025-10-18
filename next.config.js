// Import Sentry webpack plugin
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Optimize production build
  compress: true,

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode

  // Disable static generation to avoid build errors
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },

  // Skip ESLint during build (run separately in CI/CD)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Skip TypeScript errors during build (for rapid deployment)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Configure image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60, // Cache images for 60 seconds
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react', 'date-fns'],
  },


  // Webpack configuration for optional dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark optional dependencies as external to avoid bundling errors
      // These will gracefully fallback if not installed
      // NOTE: better-sqlite3 removed from externals - now using lazy loading in lib/db.ts
      config.externals = config.externals || [];
      config.externals.push('pg', 'pg-native', 'ioredis', 'bufferutil', 'utf-8-validate', 'snoowrap');
    }

    // NOTE: Do NOT exclude app/tools directory - it contains free tool pages
    // Only exclude /tools/ at root level (Electron build scripts, etc.)
    // App Router pages in app/tools/ must be compiled

    // Suppress warnings for optional dependencies
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Module not found.*ioredis/,
      /Module not found.*bufferutil/,
      /Module not found.*utf-8-validate/,
      /Attempted import error.*'db' is not exported/,
      // Ignore Electron/Vite files and third-party integrations (NOT app/tools!)
      /src\//,
      /electron\//,
      /web-app\//,
      /integrations\//,
      /_src_electron\//,
      /_electron\//,
    ];

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic', // Better for long-term caching
    };

    return config;
  },
}

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin
  silent: true, // Suppresses source map uploading logs during build
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Only upload source maps in production
  dryRun: process.env.NODE_ENV !== 'production',

  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  widenClientFileUpload: true,
  
  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
  
  // Disable auto-instrumentation to prevent Html import issues in App Router
  autoInstrumentServerFunctions: false,

  // Disable automatic middleware instrumentation (we use instrumentation.ts instead)
  autoInstrumentMiddleware: false,

  // Disable automatic error page instrumentation to prevent Html import errors
  disableServerWebpackPlugin: false,
  disableClientWebpackPlugin: false,

  // Configure Sentry to not inject error pages (App Router only)
  automaticVercelMonitors: false,
}

// Export the configuration wrapped with Sentry
// Only wrap with Sentry if DSN is configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);
} else {
  module.exports = nextConfig;
}
