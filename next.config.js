const { withSentryConfig } = require('@sentry/nextjs');

// Extract Supabase hostname from environment variable for dynamic configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwqkbjymbarkufwvdmar.supabase.co';
const supabaseHostname = new URL(supabaseUrl).hostname;
const supabaseUrlPattern = new RegExp(`^https:\\/\\/${supabaseHostname.replace('.', '\\.')}\\/.*`, 'i');

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development' && process.env.ENABLE_PWA !== 'true',
  buildExcludes: [/middleware-manifest\.json$/], // Critical: prevent PWA from caching middleware manifest
  runtimeCaching: [
    // Supabase API calls - uses NEXT_PUBLIC_SUPABASE_URL
    {
      urlPattern: supabaseUrlPattern,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // tRPC API calls - optimized for enterprise operations
    {
      urlPattern: /^https?:\/\/.*\/api\/trpc\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'trpc-api-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 // 30 seconds for fresher data
        },
        networkTimeoutSeconds: 5, // Faster timeout
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Static assets (images, fonts)
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    // Font files
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'font-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    // Document files - PDFs, Excel, Word
    {
      urlPattern: /\.(?:pdf|docx|xlsx|pptx|doc|xls|ppt)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'document-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        }
      }
    },
    // CSS and JavaScript files
    {
      urlPattern: /\.(?:css|js)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
        }
      }
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
        }
      }
    },
    // All other requests
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'https-cache',
        networkTimeoutSeconds: 15,
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ],
  fallbacks: {
    document: '/offline'
  }
});

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

  // Image optimization - OPTIMIZED FOR PERFORMANCE
  images: {
    // Modern image formats for better compression
    formats: ['image/avif', 'image/webp'],

    // Responsive image sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Cache TTL for optimized images
    minimumCacheTTL: 60,

    // Allowed image domains - uses NEXT_PUBLIC_SUPABASE_URL
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: supabaseHostname,
      },
    ],
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
    // React Compiler - DISABLED: Experimental, has peer dependency conflicts with current setup
    // reactCompiler: true,

    // Server actions configuration
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000", "192.168.50.158:3000"],
    },
  },

  // Headers for security and performance
  async headers() {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Base headers for all environments
    const baseHeaders = [
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
      // Permissions Policy
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    // Production-only strict security headers
    const productionHeaders = [
      // Strict Transport Security (HSTS) - production only
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains',
      },
      // Cross-Origin Policies - production only
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'credentialless',
      },
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
    ];

    // Content Security Policy - different for dev/prod
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // tRPC requires unsafe-eval
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com", // Tailwind + Google Fonts
      "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com", // Explicit style-src-elem for external stylesheets
      `img-src 'self' data: blob: https://${supabaseHostname}`,
      "font-src 'self' https://fonts.gstatic.com", // Google Fonts
      `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname} https://*.ingest.us.sentry.io`, // Supabase + Sentry
      "worker-src 'self' blob:", // Web Workers
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];

    // Only upgrade to HTTPS in production (this was breaking local dev!)
    if (!isDevelopment) {
      cspDirectives.push("upgrade-insecure-requests");
    }

    const cspHeader = {
      key: 'Content-Security-Policy',
      value: cspDirectives.join('; '),
    };

    return [
      {
        source: '/(.*)',
        headers: isDevelopment
          ? [...baseHeaders, cspHeader]
          : [...baseHeaders, ...productionHeaders, cspHeader],
      },
    ];
  },

  // Output configuration for optimal builds
  // REMOVED: output: 'standalone' - breaks middleware execution in dev (GitHub Issue #43319)
  // TODO: Re-enable conditionally for Docker builds only: output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

  // Disable webpack configuration when using Turbopack
  // Turbopack handles module resolution automatically and more efficiently
  webpack: undefined,
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

// Wrap with PWA in production only
const configWithPWA = process.env.NODE_ENV === 'production' 
  ? withPWA(nextConfig)
  : nextConfig;

// Export configuration with or without Sentry based on environment
module.exports = process.env.NODE_ENV === 'development' 
  ? configWithPWA
  : withSentryConfig(configWithPWA, sentryWebpackPluginOptions);