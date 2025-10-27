// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  // Reduce sample rate in production to control costs (10% of transactions)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Enable performance monitoring
  enabled: process.env.NODE_ENV === 'production',

  // Max breadcrumbs to keep (reduce for performance)
  maxBreadcrumbs: 50,

  // Attach stack traces to all messages
  attachStacktrace: true,

  // Filter out errors we don't care about
  ignoreErrors: [
    // Database connection errors that are transient
    'Connection terminated unexpectedly',
    'Connection terminated',
    // Prisma errors that are expected
    'Invalid `prisma',
    // Rate limit errors (expected behavior)
    'Too Many Requests',
    'Rate limit exceeded',
    // Auth errors (not critical)
    'UNAUTHORIZED',
    'Authentication required',
    // Network errors
    'Network request failed',
    'Failed to fetch',
    // Aborted requests
    'The user aborted a request',
  ],

  // Before sending error, filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from error context
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['authorization'];
      delete event.request.headers?.['cookie'];
    }

    // Filter out email addresses from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
        if (breadcrumb.message) {
          // Simple email regex replacement
          breadcrumb.message = breadcrumb.message.replace(
            /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            '[EMAIL_REDACTED]'
          );
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Configure integrations
  integrations: [
    // Database query tracking
    Sentry.prismaIntegration(),
  ],
});
