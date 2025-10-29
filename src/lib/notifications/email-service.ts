/**
 * Email Service using Resend API
 *
 * Handles all email sending functionality including:
 * - Transactional emails
 * - Notification emails
 * - Template-based emails
 * - Batch emails
 */

import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get default FROM email address
 */
function getDefaultFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL || 'notifications@limn.us.com';
}

/**
 * Send email via Resend API
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  try {
    // Validate Resend API key
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email] RESEND_API_KEY not configured');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    // Ensure we have either HTML or text content
    if (!params.html && !params.text) {
      throw new Error('Either html or text content must be provided');
    }

    // Build email options, filtering undefined values
    const emailOptions: any = {
      from: params.from || getDefaultFromEmail(),
      to: params.to,
      subject: params.subject,
    };

    if (params.html) emailOptions.html = params.html;
    if (params.text) emailOptions.text = params.text;
    if (params.cc) emailOptions.cc = params.cc;
    if (params.bcc) emailOptions.bcc = params.bcc;
    if (params.replyTo) emailOptions.replyTo = params.replyTo;
    if (params.attachments) emailOptions.attachments = params.attachments;
    if (params.tags) emailOptions.tags = params.tags;

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      console.error('[Email] Resend API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('[Email] ✅ Email sent successfully:', data?.id);

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send email using a template
 */
export async function sendTemplateEmail(
  templateId: string,
  data: Record<string, any>,
  params: Omit<SendEmailParams, 'html' | 'text'>
): Promise<SendEmailResult> {
  try {
    // For now, we'll use simple template replacement
    // In the future, this could integrate with a template engine
    const template = await getEmailTemplate(templateId);

    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateId}`,
      };
    }

    // Simple variable replacement
    let html = template.html_content || '';
    let text = template.text_content || '';
    let subject = template.subject || '';

    // Replace variables in format {{variableName}}
    for (const [key, value] of Object.entries(data)) {
      // Use replaceAll instead of RegExp to avoid ESLint security warning
      const placeholder = `{{${key}}}`;
      html = html.replaceAll(placeholder, String(value));
      text = text.replaceAll(placeholder, String(value));
      subject = subject.replaceAll(placeholder, String(value));
    }

    return sendEmail({
      ...params,
      subject: params.subject || subject,
      html,
      text,
    });
  } catch (error) {
    console.error('[Email] Error sending template email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send batch emails (up to 100 at a time per Resend limits)
 */
export async function sendBatchEmails(
  emails: SendEmailParams[]
): Promise<SendEmailResult[]> {
  const results: SendEmailResult[] = [];

  // Process in batches of 100
  const batchSize = 100;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const batchResults = await Promise.all(
      batch.map(emailParams => sendEmail(emailParams))
    );

    results.push(...batchResults);
  }

  return results;
}

/**
 * Get email template from database
 */
async function getEmailTemplate(templateId: string) {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const template = await prisma.email_templates.findUnique({
      where: { id: templateId },
      select: {
        subject: true,
        html_content: true,
        text_content: true,
      },
    });

    await prisma.$disconnect();

    return template;
  } catch (error) {
    console.error('[Email] Error fetching template:', error);
    return null;
  }
}

/**
 * Common email templates
 */
export const EmailTemplates = {
  /**
   * Order confirmation email
   */
  orderConfirmation: (orderNumber: string, customerName: string, totalAmount: string) => ({
    subject: `Order Confirmation #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Confirmation</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your order! Your order #${orderNumber} has been confirmed.</p>
        <p><strong>Total Amount:</strong> ${totalAmount}</p>
        <p>We'll send you another email when your order ships.</p>
        <p>Best regards,<br>Limn Systems Team</p>
      </div>
    `,
  }),

  /**
   * Shipping notification email
   */
  shippingNotification: (orderNumber: string, trackingNumber: string, carrier: string) => ({
    subject: `Your Order #${orderNumber} Has Shipped`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Order Has Shipped!</h2>
        <p>Great news! Your order #${orderNumber} is on its way.</p>
        <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
        <p><strong>Carrier:</strong> ${carrier}</p>
        <p>Best regards,<br>Limn Systems Team</p>
      </div>
    `,
  }),

  /**
   * Payment received email
   */
  paymentReceived: (invoiceNumber: string, amount: string, paymentMethod: string) => ({
    subject: `Payment Received - Invoice #${invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Payment Received</h2>
        <p>We've successfully received your payment.</p>
        <p><strong>Invoice:</strong> #${invoiceNumber}</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
        <p>Thank you for your business!</p>
        <p>Best regards,<br>Limn Systems Team</p>
      </div>
    `,
  }),

  /**
   * Task assignment email
   */
  taskAssignment: (taskTitle: string, assigneeName: string, dueDate: string, taskUrl: string) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Task Assigned</h2>
        <p>Hello ${assigneeName},</p>
        <p>You've been assigned a new task: <strong>${taskTitle}</strong></p>
        <p><strong>Due Date:</strong> ${dueDate}</p>
        <a href="${taskUrl}"
           style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 16px;">
          View Task
        </a>
        <p style="margin-top: 24px;">Best regards,<br>Limn Systems Team</p>
      </div>
    `,
  }),
};
