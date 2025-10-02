const { withSentryConfig } = require('@sentry/nextjs');

// Suppress Node.js url.parse() deprecation warnings from dependencies
const originalEmit = process.emit;
process.emit = function (name, data, ...args) {
  if (
    name === 'warning' &&
    typeof data === 'object' &&
    data.name === 'DeprecationWarning' &&
    data.message.includes('url.parse')
  ) {
    return false;
  }
  return originalEmit.apply(process, arguments);
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set workspace root to prevent inference warnings
  outputFileTracingRoot: __dirname,

  // Image optimization
  images: {
    domains: ['localhost', 'via.placeholder.com', 'gwqkbjymbarkufwvdmar.supabase.co'],
  },

  // Production optimizations
  compress: true,

  // Turbopack configuration (updated for Next.js 15)
  // Note: memoryLimit is not a supported option in Next.js 15.5.4

  // Allow network access from other devices
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '192.168.50.158:3000',
  ],

  // Experimental features
  experimental: {
    // Server actions configuration
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "192.168.50.158:3000"],
    },
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Strict Transport Security (HSTS)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // Cross-Origin Policies
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // tRPC requires unsafe-eval
              "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
              "img-src 'self' data: blob: https://gwqkbjymbarkufwvdmar.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://gwqkbjymbarkufwvdmar.supabase.co wss://gwqkbjymbarkufwvdmar.supabase.co",
              "frame-src 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Output configuration for optimal builds
  output: 'standalone',

  // Webpack configuration for Node.js modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle Node.js modules in client bundles
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
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