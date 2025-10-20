/**
 * Email Template: Access Denied (to User)
 *
 * Sent to user when their access request has been denied.
 */

import { sendEmail } from '../email-service';

export async function sendAccessDeniedEmail(params: {
  to: string;
  firstName: string;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, firstName, reason } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .info-box {
            background-color: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Access Request Update</h1>
          </div>
          <div class="content">
            <p>Hi ${firstName},</p>

            <p>Thank you for your interest in Limn Systems Enterprise.</p>

            <p>After reviewing your access request, we're unable to approve it at this time.</p>

            ${reason ? `
            <div class="info-box">
              <strong>Reason:</strong><br>
              ${reason}
            </div>
            ` : ''}

            <p>If you believe this is an error or have additional information to share, please contact our support team at <a href="mailto:support@limn.us.com">support@limn.us.com</a>.</p>

            <p>Thank you for your understanding.</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Limn Systems Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>Limn Systems Enterprise</p>
            <p>If you have questions, please contact support@limn.us.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Access Request Update - Limn Systems Enterprise

Hi ${firstName},

Thank you for your interest in Limn Systems Enterprise.

After reviewing your access request, we're unable to approve it at this time.

${reason ? `Reason: ${reason}` : ''}

If you believe this is an error or have additional information to share, please contact our support team at support@limn.us.com.

Thank you for your understanding.

Best regards,
The Limn Systems Team

---
Limn Systems Enterprise
If you have questions, please contact support@limn.us.com
  `.trim();

  return sendEmail({
    to,
    subject: `Access Request Update - Limn Systems`,
    html,
    text,
  });
}
