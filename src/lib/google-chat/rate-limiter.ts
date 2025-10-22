/**
 * Shared Rate Limiter for Google Chat Notifications
 *
 * Prevents overwhelming Google Chat webhooks with too many messages.
 * Enforces minimum interval between messages per webhook URL.
 *
 * This is a simple in-memory rate limiter. For production with multiple
 * server instances, consider using Redis or similar distributed store.
 */

const MIN_INTERVAL_MS = 1000; // 1 second between messages

// Track last message time per webhook URL
const lastMessageTimes = new Map<string, number>();

export class RateLimiter {
  /**
   * Check if enough time has passed since last message
   * If not, wait until the interval has elapsed
   */
  async waitIfNeeded(key: string): Promise<void> {
    const lastTime = lastMessageTimes.get(key) || 0;
    const now = Date.now();
    const timeSinceLastMessage = now - lastTime;

    if (timeSinceLastMessage < MIN_INTERVAL_MS) {
      const waitTime = MIN_INTERVAL_MS - timeSinceLastMessage;
      console.log(`[Rate Limiter] Waiting ${waitTime}ms before next message...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Record that a message was sent
   * Updates the last message time for rate limiting
   */
  recordMessage(key: string): void {
    lastMessageTimes.set(key, Date.now());
  }

  /**
   * Clear rate limit history for a specific key
   * Useful for testing
   */
  clear(key: string): void {
    lastMessageTimes.delete(key);
  }

  /**
   * Clear all rate limit history
   * Useful for testing
   */
  clearAll(): void {
    lastMessageTimes.clear();
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
