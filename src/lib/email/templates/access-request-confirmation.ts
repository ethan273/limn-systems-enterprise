/**
 * Access Request Confirmation Email Template
 *
 * Sent to users immediately after they submit an access request.
 * Provides confirmation that their request was received and sets expectations.
 */

import { sendEmail } from '../email-service';

export interface AccessRequestConfirmationData {
  email: string;
  name: string;
  userType: string;
  company?: string;
}

/**
 * Send access request confirmation email to user
 */
export async function sendAccessRequestConfirmation(
  data: AccessRequestConfirmationData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { email, name, userType, company } = data;

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
            background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%);
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
            background: #f3f4f6;
            border-left: 4px solid #2563EB;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .info-box strong {
            color: #1f2937;
            display: block;
            margin-bottom: 4px;
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
          .status-badge {
            display: inline-block;
            background: #FEF3C7;
            color: #92400E;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>✓ Access Request Received</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>

          <p>Thank you for your interest in Limn Systems! We've received your request for <strong>${userType}</strong> access and our team will review it shortly.</p>

          <div class="info-box">
            <strong>Request Details:</strong>
            <div>Email: ${email}</div>
            <div>Name: ${name}</div>
            ${company ? `<div>Company: ${company}</div>` : ''}
            <div>Access Level: ${userType}</div>
          </div>

          <div class="status-badge">⏳ Pending Review</div>

          <h3>What happens next?</h3>
          <ol>
            <li><strong>Review</strong> - Our team will review your request (typically within 1-2 business days)</li>
            <li><strong>Notification</strong> - You'll receive an email once your request is processed</li>
            <li><strong>Access</strong> - If approved, you'll receive login instructions via email</li>
          </ol>

          <p><strong>Need immediate assistance?</strong><br>
          If your request is time-sensitive, please contact us at <a href="mailto:support@limn.systems">support@limn.systems</a></p>

          <p>Thank you,<br>
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
Access Request Received

Hi ${name},

Thank you for your interest in Limn Systems! We've received your request for ${userType} access and our team will review it shortly.

REQUEST DETAILS:
- Email: ${email}
- Name: ${name}
${company ? `- Company: ${company}` : ''}
- Access Level: ${userType}
- Status: Pending Review

WHAT HAPPENS NEXT:
1. Review - Our team will review your request (typically within 1-2 business days)
2. Notification - You'll receive an email once your request is processed
3. Access - If approved, you'll receive login instructions via email

Need immediate assistance?
If your request is time-sensitive, please contact us at support@limn.systems

Thank you,
Limn Systems Team

---
Limn Systems | Enterprise Manufacturing Platform
This is an automated message. Please do not reply to this email.
  `.trim();

  return sendEmail({
    to: email,
    subject: '✓ Access Request Received - Limn Systems',
    html,
    text,
  });
}
