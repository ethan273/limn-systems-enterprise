/**
 * Unified Google Chat Notification System
 *
 * Provides a consolidated interface for all Google Chat notifications
 * across Auth, Admin, QC, and Factory Review domains.
 *
 * Usage:
 * ```typescript
 * import { notifyAccessRequest, sendQCNotification } from '@/lib/google-chat';
 * ```
 */

// Core client
export { sendGoogleChatMessage } from './client';
export type { GoogleChatMessage, SendMessageOptions, SendMessageResult } from './client';

// Formatters
export { createCardV2Message, getIconForType, getStatusEmoji, formatMetadataWidgets } from './formatters';
export type { NotificationType } from './formatters';

// Auth/Admin notifications
export {
  notifyAccessRequest,
  notifyMagicLinkSent,
  notifyAccessApproved,
  notifyAccessDenied,
  notifyUserInvited,
} from './auth-notifications';
export type {
  AccessRequestData,
  MagicLinkData,
  AccessApprovedData,
  AccessDeniedData,
  UserInvitedData,
} from './auth-notifications';

// QC/Factory notifications
export {
  sendQCNotification,
  sendFactoryReviewNotification,
  sendSupervisorNudge,
} from './qc-notifications';
export type {
  QCNotificationData,
  FactoryReviewNotificationData,
  SupervisorNudgeData,
} from './qc-notifications';

// Rate limiter (for advanced usage)
export { rateLimiter, RateLimiter } from './rate-limiter';
