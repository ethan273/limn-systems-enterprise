/**
 * Email Service Utility
 *
 * Handles email sending using Resend API.
 * Provides methods for sending transactional emails with attachments.
 */

import { Resend } from 'resend';

let resendInstance: Resend | null = null;

/**
 * Get Resend instance (lazy initialization)
 */
function getResend(): Resend | null {
  if (!resendInstance && process.env.RESEND_API_KEY) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

/**
 * Send an email with optional attachments
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const resend = getResend();

  if (!resend) {
    console.warn('Resend not configured - RESEND_API_KEY environment variable not set');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  const fromEmail = options.from || process.env.RESEND_FROM_EMAIL || 'noreply@limn.app';

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return {
      success: true,
      messageId: result.data?.id,
    };
  } catch (error: any) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send invoice PDF via email
 */
export async function sendInvoiceEmail(
  to: string,
  invoiceNumber: string,
  customerName: string,
  pdfBuffer: Buffer
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563EB; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px 20px; }
          .footer { background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice from Limn Systems</h1>
          </div>
          <div class="content">
            <p>Dear ${customerName},</p>
            <p>Thank you for your business. Please find attached your invoice <strong>#${invoiceNumber}</strong>.</p>
            <p>The invoice details are included in the attached PDF document.</p>
            <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>
            <p>Thank you,<br>
            Limn Systems Team</p>
          </div>
          <div class="footer">
            <p>Limn Systems | 123 Business St, San Francisco, CA 94105</p>
            <p>billing@limn.systems | (555) 123-4567</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Dear ${customerName},

Thank you for your business. Please find attached your invoice #${invoiceNumber}.

The invoice details are included in the attached PDF document.

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you,
Limn Systems Team

---
Limn Systems | 123 Business St, San Francisco, CA 94105
billing@limn.systems | (555) 123-4567
  `.trim();

  return sendEmail({
    to,
    subject: `Invoice #${invoiceNumber} from Limn Systems`,
    html,
    text,
    attachments: [
      {
        filename: `invoice-${invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
