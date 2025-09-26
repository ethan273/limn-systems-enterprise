const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'via.placeholder.com'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "127.0.0.1:3000"],
    },
  },
}

// Sentry configuration
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production and if auth token is provided
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Disable source map upload in development
  disableLogger: process.env.NODE_ENV === 'development',
  hideSourceMaps: true,
}

// Export configuration with Sentry enabled
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions)