/**
 * Portal Access Revoked Email Template
 *
 * Sent to partner contacts when their portal access is revoked.
 * Professional tone, provides context and contact information.
 */

import { sendEmail } from '../email-service';

export interface PortalAccessRevokedData {
  email: string;
  name: string;
  partnerName: string;
  reason?: string;
  revokedBy?: string;
  contactEmail?: string;
}

/**
 * Send portal access revoked email to partner contact
 */
export async function sendPortalAccessRevoked(
  data: PortalAccessRevokedData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, name, partnerName, reason, revokedBy, contactEmail } = data;

  const supportEmail = contactEmail || 'support@limn.systems';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            background: white;
            padding: 40px 30px;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
          }
          .info-box {
            background: #FEF3C7;
            border-left: 4px solid #F59E0B;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .details-box {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
          }
          .contact-box {
            background: #DBEAFE;
            border-left: 4px solid #2563EB;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f9fafb;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 8px 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Portal Access Update</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>

          <div class="info-box">
            <strong>Notice:</strong> Your access to the <strong>${partnerName}</strong> Partner Portal has been updated.
          </div>

          <p>This email is to inform you that your portal access has been temporarily suspended or revoked. You will no longer be able to log in to the partner portal at this time.</p>

          <div class="details-box">
            <p><strong>Partner:</strong> ${partnerName}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${revokedBy ? `<p><strong>Updated By:</strong> ${revokedBy}</p>` : ''}
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          </div>

          <h3>What This Means</h3>
          <ul>
            <li>You can no longer log in to the partner portal</li>
            <li>Access to projects, quotes, and orders is temporarily unavailable</li>
            <li>This change is effective immediately</li>
          </ul>

          <div class="contact-box">
            <h3 style="margin-top: 0;">Questions or Concerns?</h3>
            <p style="margin-bottom: 0;">If you believe this is an error or would like to discuss restoring access, please contact:</p>
            <ul style="margin: 10px 0;">
              <li>Your Limn Systems representative</li>
              <li>Email: <a href="mailto:${supportEmail}">${supportEmail}</a></li>
            </ul>
          </div>

          <p>We value our partnership and are here to help if you have any questions.</p>

          <p>Best regards,<br>
          <strong>Limn Systems Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>Limn Systems</strong><br>
          Enterprise Manufacturing Platform</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Portal Access Update

Hi ${name},

This email is to inform you that your access to the ${partnerName} Partner Portal has been updated. You will no longer be able to log in to the partner portal at this time.

DETAILS:
- Partner: ${partnerName}
- Email: ${email}
${revokedBy ? `- Updated By: ${revokedBy}` : ''}
${reason ? `- Reason: ${reason}` : ''}

WHAT THIS MEANS:
- You can no longer log in to the partner portal
- Access to projects, quotes, and orders is temporarily unavailable
- This change is effective immediately

QUESTIONS OR CONCERNS?
If you believe this is an error or would like to discuss restoring access, please contact:
- Your Limn Systems representative
- Email: ${supportEmail}

We value our partnership and are here to help if you have any questions.

Best regards,
Limn Systems Team

---
Limn Systems | Enterprise Manufacturing Platform
This is an automated message. Please do not reply to this email.
  `.trim();

  return sendEmail({
    to: email,
    subject: `Portal Access Update - ${partnerName}`,
    html,
    text,
  });
}
