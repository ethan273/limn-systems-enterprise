/**
 * Rate Limiting Utility
 *
 * Implements rate limiting using Upstash Redis to protect API endpoints
 * from abuse and excessive usage.
 *
 * @module rate-limit
 * @created 2025-10-26
 * @phase Grand Plan - Critical Fix
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // API endpoints - general requests
  API_GENERAL: {
    requests: 100,
    window: '1 m', // 100 requests per minute
  },

  // Email sending - prevent spam
  EMAIL_SEND: {
    requests: 10,
    window: '1 m', // 10 emails per minute per user
  },

  // Campaign operations - create/send
  CAMPAIGN_OPS: {
    requests: 20,
    window: '1 h', // 20 campaign operations per hour
  },

  // Authentication attempts
  AUTH_ATTEMPTS: {
    requests: 5,
    window: '15 m', // 5 auth attempts per 15 minutes
  },

  // Public endpoints (unsubscribe, etc)
  PUBLIC_ENDPOINTS: {
    requests: 20,
    window: '1 m', // 20 requests per minute
  },

  // Heavy operations (file uploads, processing)
  HEAVY_OPS: {
    requests: 10,
    window: '5 m', // 10 operations per 5 minutes
  },
} as const;

/**
 * Create a Redis client for rate limiting
 * Falls back to in-memory if Redis is not configured
 */
function createRedisClient() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    console.warn('[rate-limit] Redis not configured, using in-memory rate limiting (not recommended for production)');
    return null;
  }

  return new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

/**
 * Create rate limiter instances
 */
const redis = createRedisClient();

/**
 * General API rate limiter (100 req/min)
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.API_GENERAL.requests,
        RATE_LIMITS.API_GENERAL.window
      ),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null;

/**
 * Email sending rate limiter (10 emails/min)
 */
export const emailRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.EMAIL_SEND.requests,
        RATE_LIMITS.EMAIL_SEND.window
      ),
      analytics: true,
      prefix: 'ratelimit:email',
    })
  : null;

/**
 * Campaign operations rate limiter (20 ops/hour)
 */
export const campaignRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.CAMPAIGN_OPS.requests,
        RATE_LIMITS.CAMPAIGN_OPS.window
      ),
      analytics: true,
      prefix: 'ratelimit:campaign',
    })
  : null;

/**
 * Authentication rate limiter (5 attempts/15min)
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.AUTH_ATTEMPTS.requests,
        RATE_LIMITS.AUTH_ATTEMPTS.window
      ),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null;

/**
 * Public endpoints rate limiter (20 req/min)
 */
export const publicRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.PUBLIC_ENDPOINTS.requests,
        RATE_LIMITS.PUBLIC_ENDPOINTS.window
      ),
      analytics: true,
      prefix: 'ratelimit:public',
    })
  : null;

/**
 * Heavy operations rate limiter (10 ops/5min)
 */
export const heavyOpsRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(
        RATE_LIMITS.HEAVY_OPS.requests,
        RATE_LIMITS.HEAVY_OPS.window
      ),
      analytics: true,
      prefix: 'ratelimit:heavy',
    })
  : null;

/**
 * Check rate limit for a given identifier
 *
 * @param limiter - Rate limit instance to use
 * @param identifier - Unique identifier (user ID, IP address, etc)
 * @returns Promise with success status and limit info
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending?: Promise<unknown>;
}> {
  // If no Redis configured, allow all requests (with warning)
  if (!limiter) {
    console.warn('[rate-limit] Rate limiting bypassed - Redis not configured');
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    };
  }

  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending,
  };
}

/**
 * Rate limit error class
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public limit: number,
    public remaining: number,
    public reset: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Middleware helper to check rate limit and throw error if exceeded
 *
 * @param limiter - Rate limit instance to use
 * @param identifier - Unique identifier (user ID, IP address, etc)
 * @throws RateLimitError if rate limit exceeded
 */
export async function enforceRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<void> {
  const result = await checkRateLimit(limiter, identifier);

  if (!result.success) {
    throw new RateLimitError(
      `Rate limit exceeded. Try again in ${Math.ceil((result.reset - Date.now()) / 1000)} seconds.`,
      result.limit,
      result.remaining,
      result.reset
    );
  }
}

/**
 * Get rate limit headers for HTTP responses
 */
export function getRateLimitHeaders(result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };
}
