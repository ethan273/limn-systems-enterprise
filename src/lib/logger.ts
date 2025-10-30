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
export interface LogFn {
  (_message: string, _meta?: Record<string, any>): void;
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
  const pinoLogger = pino({
    level: isDevelopment ? 'debug' : 'info',
    // Pretty print in development
    transport: isDevelopment
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
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
    error: (message: string, meta?: Record<string, any>) => {
      if (meta) {
        pinoLogger.error(meta, message);
      } else {
        pinoLogger.error(message);
      }
    },
    warn: (message: string, meta?: Record<string, any>) => {
      if (meta) {
        pinoLogger.warn(meta, message);
      } else {
        pinoLogger.warn(message);
      }
    },
    info: (message: string, meta?: Record<string, any>) => {
      if (meta) {
        pinoLogger.info(meta, message);
      } else {
        pinoLogger.info(message);
      }
    },
    debug: (message: string, meta?: Record<string, any>) => {
      if (meta) {
        pinoLogger.debug(meta, message);
      } else {
        pinoLogger.debug(message);
      }
    },
    http: (message: string, meta?: Record<string, any>) => {
      // Map to info level with http prefix
      if (meta) {
        pinoLogger.info({ ...meta, type: 'http' }, message);
      } else {
        pinoLogger.info({ type: 'http' }, message);
      }
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
    error: (message: string, meta?: Record<string, any>) => {
      console.error(...formatMessage('error', message, meta));
    },
    warn: (message: string, meta?: Record<string, any>) => {
      console.warn(...formatMessage('warn', message, meta));
    },
    info: (message: string, meta?: Record<string, any>) => {
      // Only log info in development on client
      if (isDevelopment) {
        console.info(...formatMessage('info', message, meta));
      }
    },
    debug: (message: string, meta?: Record<string, any>) => {
      // Only log debug in development on client
      if (isDevelopment) {
        console.debug(...formatMessage('debug', message, meta));
      }
    },
    http: (message: string, meta?: Record<string, any>) => {
      // Only log http in development on client
      if (isDevelopment) {
        console.log(...formatMessage('http', message, meta));
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
   * @param meta - Additional metadata (optional)
   *
   * @example
   * log.error('Database connection failed', { error: err.message, userId: '123' });
   */
  error: (message: string, meta?: Record<string, any>) => {
    logger.error(message, meta);
  },

  /**
   * Log warning message
   * @param message - Warning message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * log.warn('API rate limit approaching', { remaining: 10, limit: 100 });
   */
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(message, meta);
  },

  /**
   * Log info message
   * @param message - Info message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * log.info('User logged in', { userId: '123', email: 'user@example.com' });
   */
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(message, meta);
  },

  /**
   * Log HTTP request/response
   * @param message - HTTP message
   * @param meta - Additional metadata (method, path, status, etc.)
   *
   * @example
   * log.http('API request completed', { method: 'POST', path: '/api/users', status: 200 });
   */
  http: (message: string, meta?: Record<string, any>) => {
    logger.http(message, meta);
  },

  /**
   * Log debug message (only in development)
   * @param message - Debug message
   * @param meta - Additional metadata (optional)
   *
   * @example
   * log.debug('Cache hit', { key: 'user:123', ttl: 3600 });
   */
  debug: (message: string, meta?: Record<string, any>) => {
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
    error: (message: string, meta?: Record<string, any>) => {
      log.error(`[${context}] ${message}`, meta);
    },
    warn: (message: string, meta?: Record<string, any>) => {
      log.warn(`[${context}] ${message}`, meta);
    },
    info: (message: string, meta?: Record<string, any>) => {
      log.info(`[${context}] ${message}`, meta);
    },
    http: (message: string, meta?: Record<string, any>) => {
      log.http(`[${context}] ${message}`, meta);
    },
    debug: (message: string, meta?: Record<string, any>) => {
      log.debug(`[${context}] ${message}`, meta);
    },
  };
}

// Export default
export default log;
