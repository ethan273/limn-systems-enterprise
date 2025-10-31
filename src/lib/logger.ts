/**
 * Universal Logging Utility - Pino + Console
 *
 * Production-grade logging system that works in both server and client environments:
 * - Server: Uses Pino (fast, structured logging with file/console transports)
 * - Client: Uses enhanced console with Pino-compatible API
 *
 * Features:
 * - Single unified API for server and client
 * - Structured logging with metadata
 * - Environment-aware configuration
 * - Zero bundle bloat for client (tree-shaken)
 * - Type-safe with full TypeScript support
 *
 * @module lib/logger
 * @created 2025-10-30
 */

// Type definitions for logger interface
// Flexible signature to support both structured logging and console-style logging
export interface LogFn {
  (_message: string, _meta?: any): void;
}

export interface Logger {
  error: LogFn;
  warn: LogFn;
  info: LogFn;
  debug: LogFn;
  http: LogFn;
}

/**
 * Check if we're running on the server
 */
const isServer = typeof window === 'undefined';

/**
 * Server-side logger using Pino
 */
function createServerLogger(): Logger {
  // Dynamic import to prevent bundling in client
  const pino = require('pino');

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Create Pino logger with configuration
  // NOTE: pino-pretty transport with thread-stream doesn't work with Next.js Turbopack
  // Use basic pino in development, structured JSON in production
  const pinoLogger = pino({
    level: isDevelopment ? 'debug' : 'info',
    // Disable transport in development (Turbopack compatibility issue)
    // Use basic console output instead
    transport: undefined,
    // Production: structured JSON logging
    formatters: isDevelopment
      ? undefined
      : {
          level: (label) => {
            return { level: label.toUpperCase() };
          },
        },
  });

  return {
    error: (message: string, meta?: any) => {
      // Convert meta to object if it's not already
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? meta
        : meta !== undefined
        ? { details: meta }
        : undefined;

      if (metaObj) {
        pinoLogger.error(metaObj, message);
      } else {
        pinoLogger.error(message);
      }
    },
    warn: (message: string, meta?: any) => {
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? meta
        : meta !== undefined
        ? { details: meta }
        : undefined;

      if (metaObj) {
        pinoLogger.warn(metaObj, message);
      } else {
        pinoLogger.warn(message);
      }
    },
    info: (message: string, meta?: any) => {
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? meta
        : meta !== undefined
        ? { details: meta }
        : undefined;

      if (metaObj) {
        pinoLogger.info(metaObj, message);
      } else {
        pinoLogger.info(message);
      }
    },
    debug: (message: string, meta?: any) => {
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? meta
        : meta !== undefined
        ? { details: meta }
        : undefined;

      if (metaObj) {
        pinoLogger.debug(metaObj, message);
      } else {
        pinoLogger.debug(message);
      }
    },
    http: (message: string, meta?: any) => {
      // Map to info level with http prefix
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? { ...meta, type: 'http' }
        : meta !== undefined
        ? { details: meta, type: 'http' }
        : { type: 'http' };

      pinoLogger.info(metaObj, message);
    },
  };
}

/**
 * Client-side logger using enhanced console
 */
function createClientLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const formatMessage = (level: string, message: string, meta?: Record<string, any>) => {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (meta && Object.keys(meta).length > 0) {
      return [prefix, message, meta];
    }
    return [prefix, message];
  };

  return {
    error: (message: string, meta?: any) => {
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? meta
        : meta !== undefined
        ? { details: meta }
        : undefined;
      console.error(...formatMessage('error', message, metaObj));
    },
    warn: (message: string, meta?: any) => {
      const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
        ? meta
        : meta !== undefined
        ? { details: meta }
        : undefined;
      console.warn(...formatMessage('warn', message, metaObj));
    },
    info: (message: string, meta?: any) => {
      // Only log info in development on client
      if (isDevelopment) {
        const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
          ? meta
          : meta !== undefined
          ? { details: meta }
          : undefined;
        console.info(...formatMessage('info', message, metaObj));
      }
    },
    debug: (message: string, meta?: any) => {
      // Only log debug in development on client
      if (isDevelopment) {
        const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
          ? meta
          : meta !== undefined
          ? { details: meta }
          : undefined;
        console.debug(...formatMessage('debug', message, metaObj));
      }
    },
    http: (message: string, meta?: any) => {
      // Only log http in development on client
      if (isDevelopment) {
        const metaObj = (meta && typeof meta === 'object' && !Array.isArray(meta))
          ? meta
          : meta !== undefined
          ? { details: meta }
          : undefined;
        console.log(...formatMessage('http', message, metaObj));
      }
    },
  };
}

/**
 * Create the logger instance based on environment
 */
const logger: Logger = isServer ? createServerLogger() : createClientLogger();

/**
 * Main logger export with convenience methods
 */
export const log = {
  /**
   * Log error message
   * @param message - Error message
   * @param meta - Additional metadata (optional) - accepts any type, automatically wrapped if needed
   *
   * @example
   * log.error('Database connection failed', { error: err.message, userId: '123' });
   * log.error('Failed to connect', err); // Auto-wrapped as { details: err }
   */
  error: (message: string, meta?: any) => {
    logger.error(message, meta);
  },

  /**
   * Log warning message
   * @param message - Warning message
   * @param meta - Additional metadata (optional) - accepts any type, automatically wrapped if needed
   *
   * @example
   * log.warn('API rate limit approaching', { remaining: 10, limit: 100 });
   */
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta);
  },

  /**
   * Log info message
   * @param message - Info message
   * @param meta - Additional metadata (optional) - accepts any type, automatically wrapped if needed
   *
   * @example
   * log.info('User logged in', { userId: '123', email: 'user@example.com' });
   */
  info: (message: string, meta?: any) => {
    logger.info(message, meta);
  },

  /**
   * Log HTTP request/response
   * @param message - HTTP message
   * @param meta - Additional metadata (method, path, status, etc.) - accepts any type, automatically wrapped if needed
   *
   * @example
   * log.http('API request completed', { method: 'POST', path: '/api/users', status: 200 });
   */
  http: (message: string, meta?: any) => {
    logger.http(message, meta);
  },

  /**
   * Log debug message (only in development)
   * @param message - Debug message
   * @param meta - Additional metadata (optional) - accepts any type, automatically wrapped if needed
   *
   * @example
   * log.debug('Cache hit', { key: 'user:123', ttl: 3600 });
   */
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta);
  },
};

/**
 * Create a child logger with a specific context
 * Useful for namespacing logs by module/router/service
 *
 * @param context - Context name (e.g., 'Auth', 'Database', 'tRPC')
 * @returns Child logger with context
 *
 * @example
 * const authLogger = createLogger('Auth');
 * authLogger.info('User logged in', { userId: '123' });
 * // Output: [Auth] User logged in { userId: '123' }
 */
export function createLogger(context: string): Logger {
  return {
    error: (message: string, meta?: any) => {
      log.error(`[${context}] ${message}`, meta);
    },
    warn: (message: string, meta?: any) => {
      log.warn(`[${context}] ${message}`, meta);
    },
    info: (message: string, meta?: any) => {
      log.info(`[${context}] ${message}`, meta);
    },
    http: (message: string, meta?: any) => {
      log.http(`[${context}] ${message}`, meta);
    },
    debug: (message: string, meta?: any) => {
      log.debug(`[${context}] ${message}`, meta);
    },
  };
}

// Export default
export default log;
