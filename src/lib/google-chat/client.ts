/**
 * Unified Google Chat Webhook Client
 *
 * Provides a single, consistent interface for sending Google Chat notifications
 * across all domains (Auth, Admin, QC, Factory Review, etc.)
 *
 * Features:
 * - Supports both environment variable and parameter-based webhook URLs
 * - Shared rate limiting across all notification types
 * - Graceful degradation when webhook URL not configured
 * - Consistent error handling and logging
 * - Supports both Cards API and CardsV2 API formats
 */

import { rateLimiter } from './rate-limiter';

export interface GoogleChatMessage {
  text?: string;
  cards?: any[]; // Cards API (v1) format
  cardsV2?: any[]; // CardsV2 API format
}

export interface SendMessageOptions {
  webhookUrl?: string; // Optional: override environment variable
  message: GoogleChatMessage;
  rateLimitKey?: string; // Optional: custom rate limit key
}

export interface SendMessageResult {
  success: boolean;
  error?: string;
}

/**
 * Get Google Chat webhook URL
 * Supports both parameter-based and environment-based configuration
 */
function getWebhookUrl(override?: string): string | null {
  return override || process.env.GOOGLE_CHAT_WEBHOOK_URL || null;
}

/**
 * Send a message to Google Chat webhook
 *
 * @param options - Message sending options
 * @returns Result with success status and optional error
 */
export async function sendGoogleChatMessage(
  options: SendMessageOptions
): Promise<SendMessageResult> {
  const webhookUrl = getWebhookUrl(options.webhookUrl);

  // Graceful degradation: webhook not configured
  if (!webhookUrl) {
    console.warn('[Google Chat] Webhook URL not configured - skipping notification');
    return {
      success: false,
      error: 'Webhook URL not configured',
    };
  }

  // Apply rate limiting
  const rateLimitKey = options.rateLimitKey || webhookUrl;
  await rateLimiter.waitIfNeeded(rateLimitKey);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options.message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Google Chat] Webhook request failed:', {
        status: response.status,
        error: errorText,
      });
      return {
        success: false,
        error: `Webhook request failed: ${response.status}`,
      };
    }

    // Update rate limiter
    rateLimiter.recordMessage(rateLimitKey);

    console.log('[Google Chat] ✅ Message sent successfully');
    return { success: true };
  } catch (error) {
    console.error('[Google Chat] Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
