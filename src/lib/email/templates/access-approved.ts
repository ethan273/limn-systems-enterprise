/**
 * Email Template: Access Approved (to User)
 *
 * Sent to user when their access request has been approved.
 * Includes magic link for immediate sign-in.
 */

import { sendEmail } from '../email-service';

export async function sendAccessApprovedEmail(params: {
  to: string;
  firstName: string;
  magicLink: string;
  userType: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, firstName, magicLink, userType } = params;

  const portalName = userType === 'customer' ? 'Client Portal' : 'Partner Portal';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .success-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .button {
            display: inline-block;
            background-color: #10b981;
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
          }
          .info-box {
            background-color: #ecfdf5;
            border-left: 4px solid #10b981;
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
            <h1>✅ Access Approved!</h1>
          </div>
          <div class="content">
            <div class="success-icon">🎉</div>

            <p>Hi ${firstName},</p>

            <p><strong>Great news!</strong> Your access request to Limn Systems Enterprise has been approved.</p>

            <p>You can now access the <strong>${portalName}</strong> by clicking the button below:</p>

            <p style="text-align: center;">
              <a href="${magicLink}" class="button">
                Sign In to ${portalName}
              </a>
            </p>

            <div class="info-box">
              <strong>📌 Important Notes:</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>This magic link is valid for <strong>1 hour</strong></li>
                <li>For future logins, you can request a new magic link from the login page</li>
                <li>No password needed - we use secure magic link authentication</li>
              </ul>
            </div>

            <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team.</p>

            <p>Welcome to Limn Systems!</p>

            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>The Limn Systems Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>Limn Systems Enterprise</p>
            <p>If you didn't request access, please ignore this email or contact support.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Access Approved - Limn Systems Enterprise

Hi ${firstName},

Great news! Your access request to Limn Systems Enterprise has been approved.

You can now access the ${portalName} by clicking this link:
${magicLink}

Important Notes:
- This magic link is valid for 1 hour
- For future logins, you can request a new magic link from the login page
- No password needed - we use secure magic link authentication

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Welcome to Limn Systems!

Best regards,
The Limn Systems Team

---
Limn Systems Enterprise
If you didn't request access, please ignore this email or contact support.
  `.trim();

  return sendEmail({
    to,
    subject: `✅ Your Limn Systems Access Has Been Approved`,
    html,
    text,
  });
}
