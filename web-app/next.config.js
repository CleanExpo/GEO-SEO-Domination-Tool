/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Optimize production build
  compress: true,

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode

  // Performance optimizations
  swcMinify: true, // Use SWC for minification (faster than Terser)

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
      // Mark pg as external to avoid bundling it
      config.externals = config.externals || [];
      config.externals.push('pg', 'pg-native');
    }

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic', // Better for long-term caching
    };

    return config;
  },
}

module.exports = nextConfig
