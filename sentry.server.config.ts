import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Configure environment
  environment: process.env.NODE_ENV,

  // Configure release
  release: process.env.npm_package_version || '0.1.0',

  // Enable tracing for database queries
  integrations: [
    // Add database integration if using Prisma
    ...(process.env.DATABASE_URL ? [
      Sentry.prismaIntegration()
    ] : []),
  ],

  // Filter out common noisy server errors
  beforeSend(event) {
    // Filter out database connection timeouts in development
    if (event.exception && event.exception.values) {
      const error = event.exception.values[0];
      if (error?.value?.includes('connect ETIMEDOUT') ||
          error?.value?.includes('Connection terminated unexpectedly')) {
        return null;
      }
    }
    return event;
  },
});