/**
 * Portal Access Granted Email Template
 *
 * Sent to partner contacts when they are granted portal access.
 * Includes portal role, allowed modules, and login instructions.
 */

import { sendEmail } from '../email-service';

export interface PortalAccessGrantedData {
  email: string;
  name: string;
  partnerName: string;
  portalRole: string;
  portalModules: string[];
  loginUrl?: string;
  grantedBy?: string;
}

/**
 * Send portal access granted email to partner contact
 */
export async function sendPortalAccessGranted(
  data: PortalAccessGrantedData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, name, partnerName, portalRole, portalModules, loginUrl, grantedBy } = data;

  const loginLink = loginUrl || 'https://app.limn.systems/portal/login';
  const modulesListHtml = portalModules.map((mod) => `<li>${mod}</li>`).join('');
  const modulesListText = portalModules.map((mod) => `- ${mod}`).join('\n');

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
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
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
          .success-box {
            background: #D1FAE5;
            border-left: 4px solid #10B981;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box {
            background: #f3f4f6;
            border: 1px solid #e5e7eb;
            padding: 20px;
            margin: 20px 0;
            border-radius: 6px;
          }
          .info-box h3 {
            margin-top: 0;
            color: #1f2937;
            font-size: 16px;
          }
          .button {
            display: inline-block;
            background: #10B981;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .button:hover {
            background: #059669;
          }
          .modules-list {
            list-style: none;
            padding: 0;
          }
          .modules-list li {
            padding: 8px 12px;
            background: #f9fafb;
            border-left: 3px solid #10B981;
            margin: 6px 0;
            border-radius: 4px;
          }
          .role-badge {
            display: inline-block;
            background: #DBEAFE;
            color: #1E40AF;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            text-transform: capitalize;
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
          <h1>🎉 Portal Access Granted!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>

          <div class="success-box">
            <strong>✓ Great news!</strong> You've been granted access to the <strong>${partnerName}</strong> Partner Portal.
          </div>

          <p>You can now access real-time information about your projects, quotes, orders, and more through our secure partner portal.</p>

          <div class="info-box">
            <h3>Your Access Details</h3>
            <p><strong>Partner:</strong> ${partnerName}</p>
            <p><strong>Role:</strong> <span class="role-badge">${portalRole}</span></p>
            ${grantedBy ? `<p><strong>Granted By:</strong> ${grantedBy}</p>` : ''}

            <h3 style="margin-top: 20px;">Available Modules</h3>
            <ul class="modules-list">
              ${modulesListHtml}
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${loginLink}" class="button">Access Partner Portal</a>
          </div>

          <h3>Getting Started</h3>
          <ol>
            <li><strong>Login</strong> - Click the button above or visit <a href="${loginLink}">${loginLink}</a></li>
            <li><strong>Authenticate</strong> - Use your email (${email}) to receive a secure login link</li>
            <li><strong>Explore</strong> - Access the modules available to your role</li>
          </ol>

          <h3>Need Help?</h3>
          <p>If you have questions about using the portal or need assistance:</p>
          <ul>
            <li>Contact your Limn Systems representative</li>
            <li>Email us at <a href="mailto:support@limn.systems">support@limn.systems</a></li>
          </ul>

          <p>Welcome aboard!<br>
          <strong>Limn Systems Team</strong></p>
        </div>
        <div class="footer">
          <p><strong>Limn Systems Partner Portal</strong><br>
          Secure access to your manufacturing projects</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;

  const text = `
Portal Access Granted!

Hi ${name},

Great news! You've been granted access to the ${partnerName} Partner Portal.

You can now access real-time information about your projects, quotes, orders, and more through our secure partner portal.

YOUR ACCESS DETAILS:
- Partner: ${partnerName}
- Role: ${portalRole}
${grantedBy ? `- Granted By: ${grantedBy}` : ''}

AVAILABLE MODULES:
${modulesListText}

GETTING STARTED:
1. Login - Visit ${loginLink}
2. Authenticate - Use your email (${email}) to receive a secure login link
3. Explore - Access the modules available to your role

NEED HELP?
If you have questions about using the portal or need assistance:
- Contact your Limn Systems representative
- Email us at support@limn.systems

Welcome aboard!
Limn Systems Team

---
Limn Systems Partner Portal
Secure access to your manufacturing projects
This is an automated message. Please do not reply to this email.
  `.trim();

  return sendEmail({
    to: email,
    subject: `🎉 Portal Access Granted - ${partnerName}`,
    html,
    text,
  });
}
