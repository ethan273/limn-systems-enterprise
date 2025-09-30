const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },

  // Production optimizations
  compress: true,

  // Turbopack configuration (updated for Next.js 15)
  // Note: memoryLimit is not a supported option in Next.js 15.5.4

  // Experimental features
  experimental: {
    // Server actions configuration
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Output configuration for optimal builds
  output: 'standalone',

  // Webpack configuration to suppress Prisma instrumentation warnings (production builds only)
  webpack: (config, { dev }) => {
    // Only apply webpack config during production builds (not with Turbopack in dev)
    if (!dev) {
      // Suppress critical dependency warnings from @prisma/instrumentation
      config.ignoreWarnings = [
        {
          module: /@prisma\/instrumentation/,
          message: /Critical dependency: the request of a dependency is an expression/,
        },
        {
          module: /@opentelemetry\/instrumentation/,
          message: /Critical dependency: the request of a dependency is an expression/,
        },
      ];
    }

    return config;
  },
};

// Sentry configuration - enterprise optimized
const sentryWebpackPluginOptions = {
  // Essential Sentry options
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Performance optimizations
  disableLogger: process.env.NODE_ENV === 'development',
  hideSourceMaps: true,
  dryRun: process.env.NODE_ENV === 'development',

  // Upload optimizations
  include: ['./src', './.next'],
  ignore: ['node_modules', 'webpack.config.js', '*.test.js', '*.test.ts', '*.test.tsx'],

  // Source map optimization
  sourcemaps: {
    disable: process.env.NODE_ENV === 'development',
    deleteAfterUpload: true,
  },

  // Release optimization
  release: {
    name: process.env.SENTRY_RELEASE || `${process.env.npm_package_name}@${process.env.npm_package_version}`,
    deploy: {
      env: process.env.NODE_ENV || 'development',
    },
  },
};

// Export configuration without Sentry in development to prevent instrumentation conflicts
module.exports = nextConfig;