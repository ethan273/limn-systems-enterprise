/**
 * Google Chat Notifications for Authentication & Admin Events
 *
 * Provides notification functions for:
 * - Access requests
 * - Magic link authentication
 * - Access approvals/denials
 * - User invitations
 *
 * Uses unified Google Chat client for consistent delivery and rate limiting.
 */

import { sendGoogleChatMessage } from './client';
import { createCardV2Message } from './formatters';

export interface AccessRequestData {
  email: string;
  name: string;
  company?: string;
  userType: string;
  phone?: string;
}

export interface MagicLinkData {
  email: string;
  userType?: string;
}

export interface AccessApprovedData {
  email: string;
  name?: string;
  approvedBy: string;
}

export interface AccessDeniedData {
  email: string;
  name?: string;
  deniedBy: string;
  reason?: string;
}

export interface UserInvitedData {
  email: string;
  name?: string;
  invitedBy: string;
  userType: string;
}

/**
 * Notify admins of new access request
 */
export async function notifyAccessRequest(
  data: AccessRequestData
): Promise<{ success: boolean; error?: string }> {
  const fullName = data.name || 'Unknown';

  const message = createCardV2Message({
    title: '🔔 New Access Request',
    message: `${fullName} (${data.email}) requested ${data.userType} access`,
    type: 'info',
    metadata: {
      Email: data.email,
      Name: fullName,
      Company: data.company || 'N/A',
      Phone: data.phone || 'N/A',
      'User Type': data.userType,
      'Action Required': 'Review at /admin/access-requests',
    },
  });

  return sendGoogleChatMessage({ message });
}

/**
 * Notify when magic link is sent
 */
export async function notifyMagicLinkSent(
  data: MagicLinkData
): Promise<{ success: boolean; error?: string }> {
  const message = createCardV2Message({
    title: '🔗 Magic Link Sent',
    message: `Magic link authentication sent to ${data.email}`,
    type: 'info',
    metadata: {
      Email: data.email,
      'User Type': data.userType || 'Unknown',
      'Login Type': 'Magic Link',
    },
  });

  return sendGoogleChatMessage({ message });
}

/**
 * Notify when access is approved
 */
export async function notifyAccessApproved(
  data: AccessApprovedData
): Promise<{ success: boolean; error?: string }> {
  const displayName = data.name || data.email;

  const message = createCardV2Message({
    title: '✅ Access Approved',
    message: `${displayName} access approved by ${data.approvedBy}`,
    type: 'success',
    metadata: {
      Email: data.email,
      'Approved By': data.approvedBy,
      Status: 'Invitation email sent',
    },
  });

  return sendGoogleChatMessage({ message });
}

/**
 * Notify when access is denied
 */
export async function notifyAccessDenied(
  data: AccessDeniedData
): Promise<{ success: boolean; error?: string }> {
  const displayName = data.name || data.email;

  const message = createCardV2Message({
    title: '❌ Access Denied',
    message: `${displayName} access denied by ${data.deniedBy}`,
    type: 'warning',
    metadata: {
      Email: data.email,
      'Denied By': data.deniedBy,
      Reason: data.reason || 'Not specified',
    },
  });

  return sendGoogleChatMessage({ message });
}

/**
 * Notify when user is directly invited by admin
 */
export async function notifyUserInvited(
  data: UserInvitedData
): Promise<{ success: boolean; error?: string }> {
  const displayName = data.name || data.email;

  const message = createCardV2Message({
    title: '📨 User Invited',
    message: `${displayName} invited as ${data.userType} by ${data.invitedBy}`,
    type: 'success',
    metadata: {
      Email: data.email,
      'User Type': data.userType,
      'Invited By': data.invitedBy,
      Status: 'Invitation email sent',
    },
  });

  return sendGoogleChatMessage({ message });
}
