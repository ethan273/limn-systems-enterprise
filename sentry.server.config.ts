// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Enable performance monitoring
  enabled: process.env.NODE_ENV === 'production',

  // Filter out errors we don't care about
  ignoreErrors: [
    // Database connection errors that are transient
    'Connection terminated unexpectedly',
    'Connection terminated',
    // Prisma errors that are expected
    'Invalid `prisma',
    // Rate limit errors
    'Too Many Requests',
  ],
});
