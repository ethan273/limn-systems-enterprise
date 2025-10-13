/**
 * Rate Limiting System for API Credentials
 *
 * Prevents abuse with configurable rate limits
 * Uses in-memory tracking with sliding window algorithm
 *
 * NOTE: Redis integration planned for Phase 3 for distributed rate limiting
 */

/**
 * Rate limit state for a credential
 */
interface RateLimitState {
  /** Recent request timestamps (last 60 seconds) */
  requests: number[];
  /** Current concurrent request count */
  activeCount: number;
}

/**
 * Rate limit tracking (in-memory)
 * Key: credentialId
 */
const rateLimits = new Map<string, RateLimitState>();

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** When the rate limit resets */
  resetAt: Date;
  /** Reason if not allowed */
  reason?: string;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  /** Requests in current minute */
  requestsThisMinute: number;
  /** Active concurrent requests */
  activeRequests: number;
  /** Configured rate limit */
  limit: number;
  /** Configured concurrent limit */
  concurrentLimit: number;
}

/**
 * Request tracker for concurrent limiting
 */
export interface RequestTracker {
  /** Call this when request completes */
  release: () => void;
}

/**
 * Check if a request is allowed based on rate limits
 *
 * Uses sliding window algorithm:
 * - Tracks requests in the last 60 seconds
 * - Automatically cleans up old entries
 *
 * @param params - Rate limit check parameters
 * @returns Rate limit result
 */
export async function checkRateLimit(params: {
  credentialId: string;
  clientIp?: string;
  rateLimit: number;      // requests per minute (0 = unlimited)
  concurrentLimit: number; // max concurrent requests (0 = unlimited)
}): Promise<RateLimitResult> {
  const { credentialId, rateLimit, concurrentLimit } = params;

  // Get or create rate limit state
  let state = rateLimits.get(credentialId);
  if (!state) {
    state = {
      requests: [],
      activeCount: 0,
    };
    rateLimits.set(credentialId, state);
  }

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Clean up old requests (older than 1 minute)
  state.requests = state.requests.filter(timestamp => timestamp > oneMinuteAgo);

  // Check concurrent limit (if enabled)
  if (concurrentLimit > 0 && state.activeCount >= concurrentLimit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(now + 1000), // Retry in 1 second
      reason: `Concurrent limit exceeded (${concurrentLimit} max)`,
    };
  }

  // Check rate limit (if enabled)
  if (rateLimit > 0) {
    const requestsThisMinute = state.requests.length;

    if (requestsThisMinute >= rateLimit) {
      // Find when the oldest request will expire
      const oldestRequest = Math.min(...state.requests);
      const resetAt = new Date(oldestRequest + 60 * 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        reason: `Rate limit exceeded (${rateLimit} requests/minute)`,
      };
    }
  }

  // Allow request and record timestamp
  state.requests.push(now);

  // Calculate reset time (1 minute from first request in window)
  const firstRequest = Math.min(...state.requests);
  const resetAt = new Date(firstRequest + 60 * 1000);

  // Calculate remaining requests
  const remaining = rateLimit > 0
    ? rateLimit - state.requests.length
    : Infinity;

  return {
    allowed: true,
    remaining: remaining === Infinity ? 999999 : remaining,
    resetAt,
  };
}

/**
 * Track an active request for concurrent limiting
 *
 * Usage:
 * ```typescript
 * const tracker = trackRequest(credentialId);
 * try {
 *   // ... perform request ...
 * } finally {
 *   tracker.release();
 * }
 * ```
 *
 * @param credentialId - Credential ID
 * @returns Request tracker with release function
 */
export function trackRequest(credentialId: string): RequestTracker {
  // Get or create rate limit state
  let state = rateLimits.get(credentialId);
  if (!state) {
    state = {
      requests: [],
      activeCount: 0,
    };
    rateLimits.set(credentialId, state);
  }

  // Increment active count
  state.activeCount++;

  // Return release function
  return {
    release: () => {
      const currentState = rateLimits.get(credentialId);
      if (currentState && currentState.activeCount > 0) {
        currentState.activeCount--;
      }
    },
  };
}

/**
 * Get current rate limit status for a credential
 *
 * @param credentialId - Credential ID
 * @param rateLimit - Configured rate limit
 * @param concurrentLimit - Configured concurrent limit
 * @returns Current rate limit status
 */
export async function getRateLimitStatus(
  credentialId: string,
  rateLimit: number,
  concurrentLimit: number
): Promise<RateLimitStatus> {
  const state = rateLimits.get(credentialId);

  if (!state) {
    return {
      requestsThisMinute: 0,
      activeRequests: 0,
      limit: rateLimit,
      concurrentLimit,
    };
  }

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  // Count requests in last minute
  const requestsThisMinute = state.requests.filter(
    timestamp => timestamp > oneMinuteAgo
  ).length;

  return {
    requestsThisMinute,
    activeRequests: state.activeCount,
    limit: rateLimit,
    concurrentLimit,
  };
}

/**
 * Reset rate limit state for a credential
 *
 * Useful for testing or manual override
 *
 * @param credentialId - Credential ID
 */
export function resetRateLimit(credentialId: string): void {
  rateLimits.delete(credentialId);
}

/**
 * Clear all rate limit state
 *
 * Useful for cleanup or testing
 */
export function clearAllRateLimits(): void {
  rateLimits.clear();
}

/**
 * Clean up old rate limit entries
 *
 * Should be called periodically to prevent memory leaks
 * Removes entries with no recent activity (>5 minutes)
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000;

  for (const [credentialId, state] of rateLimits.entries()) {
    // Clean up old requests
    state.requests = state.requests.filter(
      timestamp => timestamp > fiveMinutesAgo
    );

    // Remove entry if no recent activity and no active requests
    if (state.requests.length === 0 && state.activeCount === 0) {
      rateLimits.delete(credentialId);
    }
  }
}

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') {
  // Server-side only
  setInterval(() => {
    cleanupRateLimits();
  }, 5 * 60 * 1000);
}

/**
 * Get all rate limit statistics
 *
 * Useful for monitoring and debugging
 *
 * @returns Array of rate limit statistics
 */
export function getAllRateLimitStats(): Array<{
  credentialId: string;
  requestsThisMinute: number;
  activeRequests: number;
}> {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;

  const stats: Array<{
    credentialId: string;
    requestsThisMinute: number;
    activeRequests: number;
  }> = [];

  for (const [credentialId, state] of rateLimits.entries()) {
    const requestsThisMinute = state.requests.filter(
      timestamp => timestamp > oneMinuteAgo
    ).length;

    stats.push({
      credentialId,
      requestsThisMinute,
      activeRequests: state.activeCount,
    });
  }

  return stats;
}
