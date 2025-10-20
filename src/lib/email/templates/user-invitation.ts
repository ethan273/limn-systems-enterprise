/**
 * Email Template: User Invitation (Admin Direct Invite)
 *
 * Sent when an admin directly creates a user account and invites them.
 */

import { sendEmail } from '../email-service';

export async function sendUserInvitationEmail(params: {
  to: string;
  firstName: string;
  lastName?: string;
  magicLink: string;
  userType: string;
  invitedBy: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { to, firstName, lastName, magicLink, userType, invitedBy } = params;

  const fullName = lastName ? `${firstName} ${lastName}` : firstName;
  const portalName = userType === 'customer' ? 'Client Portal' :
                     userType === 'contractor' ? 'Partner Portal' :
                     'Dashboard';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .welcome-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
            font-size: 16px;
          }
          .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #2563EB;
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
            <h1>📨 You're Invited!</h1>
          </div>
          <div class="content">
            <div class="welcome-icon">👋</div>

            <p>Hi ${fullName},</p>

            <p><strong>${invitedBy}</strong> has invited you to join <strong>Limn Systems Enterprise</strong>.</p>

            <p>We're excited to have you on board! Click the button below to access your account:</p>

            <p style="text-align: center;">
              <a href="${magicLink}" class="button">
                Access Your Account
              </a>
            </p>

            <div class="info-box">
              <strong>📌 Getting Started:</strong>
              <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Click the button above to sign in (no password needed)</li>
                <li>This magic link is valid for <strong>1 hour</strong></li>
                <li>For future logins, request a new magic link from the login page</li>
                <li>Your account type: <strong>${userType.charAt(0).toUpperCase() + userType.slice(1)}</strong></li>
              </ul>
            </div>

            <p>You'll have access to the <strong>${portalName}</strong> where you can manage your projects, view documents, and collaborate with our team.</p>

            <p>If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.</p>

            <p style="margin-top: 30px;">
              Welcome aboard!<br>
              <strong>The Limn Systems Team</strong>
            </p>
          </div>
          <div class="footer">
            <p>Limn Systems Enterprise</p>
            <p>If you didn't expect this invitation, please contact support@limn.us.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
You're Invited to Limn Systems Enterprise!

Hi ${fullName},

${invitedBy} has invited you to join Limn Systems Enterprise.

We're excited to have you on board! Click this link to access your account:
${magicLink}

Getting Started:
- Click the link above to sign in (no password needed)
- This magic link is valid for 1 hour
- For future logins, request a new magic link from the login page
- Your account type: ${userType.charAt(0).toUpperCase() + userType.slice(1)}

You'll have access to the ${portalName} where you can manage your projects, view documents, and collaborate with our team.

If you have any questions or need assistance getting started, please don't hesitate to reach out to our support team.

Welcome aboard!
The Limn Systems Team

---
Limn Systems Enterprise
If you didn't expect this invitation, please contact support@limn.us.com
  `.trim();

  return sendEmail({
    to,
    subject: `📨 You've been invited to Limn Systems Enterprise`,
    html,
    text,
  });
}
