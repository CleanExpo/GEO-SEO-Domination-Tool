/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',

  // Optimize production build
  compress: true,

  // Configure image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Webpack configuration for optional dependencies
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark pg as external to avoid bundling it
      config.externals = config.externals || [];
      config.externals.push('pg', 'pg-native');
    }
    return config;
  },
}

module.exports = nextConfig
