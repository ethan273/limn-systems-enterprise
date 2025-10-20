/**
 * Email Template: Access Request Notification (to Admin)
 *
 * Sent to admins when a new user requests access to the system.
 */

import { sendEmail } from '../email-service';

export async function sendAccessRequestAdminEmail(params: {
  adminEmail: string;
  requestorName: string;
  requestorEmail: string;
  company?: string;
  userType: string;
  phone?: string;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const {
    adminEmail,
    requestorName,
    requestorEmail,
    company,
    userType,
    phone,
    reason,
  } = params;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563EB; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; background-color: #f9fafb; }
          .info-box { background-color: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 20px 0; }
          .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-weight: 600; color: #6b7280; min-width: 120px; }
          .info-value { color: #111827; }
          .button {
            display: inline-block;
            background-color: #2563EB;
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New Access Request</h1>
          </div>
          <div class="content">
            <p><strong>A new user has requested access to Limn Systems Enterprise.</strong></p>

            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${requestorName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${requestorEmail}</span>
              </div>
              ${company ? `
              <div class="info-row">
                <span class="info-label">Company:</span>
                <span class="info-value">${company}</span>
              </div>
              ` : ''}
              ${phone ? `
              <div class="info-row">
                <span class="info-label">Phone:</span>
                <span class="info-value">${phone}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">User Type:</span>
                <span class="info-value">${userType.charAt(0).toUpperCase() + userType.slice(1)}</span>
              </div>
              ${reason ? `
              <div class="info-row">
                <span class="info-label">Reason:</span>
                <span class="info-value">${reason}</span>
              </div>
              ` : ''}
            </div>

            <p style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/access-requests" class="button">
                Review Access Request
              </a>
            </p>

            <p style="font-size: 14px; color: #6b7280;">
              Please review this request and approve or deny access from the admin dashboard.
            </p>
          </div>
          <div class="footer">
            <p>Limn Systems Enterprise</p>
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Access Request - Limn Systems Enterprise

A new user has requested access:

Name: ${requestorName}
Email: ${requestorEmail}
${company ? `Company: ${company}` : ''}
${phone ? `Phone: ${phone}` : ''}
User Type: ${userType.charAt(0).toUpperCase() + userType.slice(1)}
${reason ? `Reason: ${reason}` : ''}

Please review this request at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/access-requests

---
Limn Systems Enterprise
This is an automated notification.
  `.trim();

  return sendEmail({
    to: adminEmail,
    subject: `🔔 New Access Request from ${requestorName}`,
    html,
    text,
  });
}
