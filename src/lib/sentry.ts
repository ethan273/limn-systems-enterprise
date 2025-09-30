import * as Sentry from '@sentry/nextjs';

// User identification for error tracking
export const identifyUser = (userId: string, email?: string, role?: string) => {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
};

// Clear user data on logout
export const clearUser = () => {
  Sentry.setUser(null);
};

// Add context to errors
export const addContext = (key: string, data: any) => {
  Sentry.setContext(key, data);
};

// Capture custom messages
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  Sentry.captureMessage(message, level);
};

// Capture exceptions with additional context
export const captureException = (error: Error, context?: { [key: string]: any }) => {
  return Sentry.captureException(error, {
    extra: context,
  });
};

// Start a performance transaction (modern Sentry API)
export const startTransaction = (name: string, op?: string) => {
  return Sentry.startSpan({ name, op }, (span) => span);
};

// Add breadcrumbs for debugging
export const addBreadcrumb = (message: string, category?: string, level?: Sentry.SeverityLevel, data?: any) => {
  Sentry.addBreadcrumb({
    message,
    category: category || 'app',
    level: level || 'info',
    data,
  });
};

// Performance monitoring for API calls
export const withSentryTracing = <T extends (..._args: any[]) => Promise<any>>(
  fn: T,
  operationName: string
): T => {
  return (async (..._args: any[]) => {
    return await Sentry.startSpan({
      name: operationName,
      op: 'function',
    }, async (span) => {
      try {
        const result = await fn(..._args);
        span?.setStatus({ code: 1 }); // OK status
        return result;
      } catch (error) {
        span?.setStatus({ code: 2 }); // INTERNAL_ERROR status
        captureException(error as Error, { operation: operationName, args: _args });
        throw error;
      }
    });
  }) as T;
};

// tRPC error handler
export const handleTRPCError = (error: any, operation: string) => {
  if (error?.code === 'UNAUTHORIZED') {
    // Don't spam Sentry with auth errors
    addBreadcrumb(`Unauthorized access to ${operation}`, 'auth', 'warning');
    return;
  }

  captureException(error, {
    operation,
    errorCode: error?.code,
    errorMessage: error?.message,
  });
};

// Database operation monitoring
export const withDatabaseTracing = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  return await Sentry.startSpan({
    op: 'db',
    name: operationName,
  }, async (span) => {
    try {
      const result = await operation();
      span?.setStatus({ code: 1 }); // OK status
      return result;
    } catch (error) {
      span?.setStatus({ code: 2 }); // INTERNAL_ERROR status
      captureException(error as Error, {
        operation: operationName,
        type: 'database'
      });
      throw error;
    }
  });
};