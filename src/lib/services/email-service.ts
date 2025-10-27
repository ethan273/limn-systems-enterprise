/**
 * Email Service
 *
 * Core email functionality for the email campaign system
 * Handles template rendering, email sending via Resend, and queue processing
 *
 * @module email-service
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

import { Resend } from 'resend';
import type { DatabaseClient } from '@/lib/db';
import type {
  EmailTemplate,
  CreateEmailTemplateInput,
  UpdateEmailTemplateInput,
  EmailCampaign,
  CreateCampaignInput,
  UpdateCampaignInput,
  CreateEmailQueueInput,
  CreateTrackingEventInput,
  TemplateVariables,
  RenderTemplateOptions,
  ResendEmailOptions,
  SendCampaignResult,
  ProcessQueueResult,
  CampaignMetrics,
  EmailEventType,
  RecipientData,
} from './email-types';

// =====================================================
// RESEND CLIENT INITIALIZATION
// =====================================================

const resend = new Resend(process.env.RESEND_API_KEY);

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM ?? 'no-reply@limn.us.com';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Limn Systems';
const DEFAULT_REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'support@limn.us.com';

// =====================================================
// TEMPLATE RENDERING
// =====================================================

/**
 * Renders an email template with variables
 * Replaces {{variable_name}} placeholders with actual values
 */
export function renderTemplate(options: RenderTemplateOptions): string {
  const { template, variables, strict = false } = options;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];

    if (value === undefined || value === null) {
      if (strict) {
        throw new Error(`Missing template variable: ${key}`);
      }
      return ''; // Replace with empty string in non-strict mode
    }

    return String(value);
  });
}

/**
 * Extracts variable names from a template
 * Returns array of variable names found in {{variable}} syntax
 */
export function extractTemplateVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];

  return Array.from(
    new Set(matches.map((match) => match.replace(/\{\{|\}\}/g, '')))
  );
}

/**
 * Validates that all required variables are provided
 */
export function validateTemplateVariables(
  template: string,
  variables: TemplateVariables
): { valid: boolean; missing: string[] } {
  const required = extractTemplateVariables(template);
  const missing = required.filter((key) => !(key in variables));

  return {
    valid: missing.length === 0,
    missing,
  };
}

// =====================================================
// EMAIL TEMPLATE SERVICE
// =====================================================

export class EmailTemplateService {
  constructor(private db: DatabaseClient) {}

  /**
   * Create a new email template
   */
  async create(input: CreateEmailTemplateInput): Promise<EmailTemplate> {
    // Extract variables from content if not provided
    const variables =
      input.variables ??
      extractTemplateVariables(input.html_content + ' ' + (input.text_content ?? ''));

    const template = await this.db.email_templates.create({
      data: {
        template_key: input.template_key,
        name: input.name,
        subject: input.subject,
        html_content: input.html_content,
        text_content: input.text_content ?? null,
        variables,
        language: input.language ?? 'en',
        is_active: input.is_active ?? true,
      },
    });

    return template as EmailTemplate;
  }

  /**
   * Get template by ID
   */
  async getById(id: string): Promise<EmailTemplate | null> {
    const template = await this.db.email_templates.findUnique({
      where: { id },
    });

    return template as EmailTemplate | null;
  }

  /**
   * Get template by template_key
   */
  async getByKey(template_key: string): Promise<EmailTemplate | null> {
    const template = await this.db.email_templates.findFirst({
      where: { template_key },
    });

    return template as EmailTemplate | null;
  }

  /**
   * List all templates
   */
  async list(params?: {
    is_active?: boolean;
    language?: string;
    limit?: number;
    offset?: number;
  }): Promise<EmailTemplate[]> {
    const where: {
      is_active?: boolean;
      language?: string;
    } = {};

    if (params?.is_active !== undefined) {
      where.is_active = params.is_active;
    }

    if (params?.language) {
      where.language = params.language;
    }

    const templates = await this.db.email_templates.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: params?.limit,
      skip: params?.offset,
    });

    return templates as EmailTemplate[];
  }

  /**
   * Update a template
   */
  async update(id: string, input: UpdateEmailTemplateInput): Promise<EmailTemplate> {
    // Re-extract variables if content changed
    let variables: string[] | undefined;
    if (input.html_content || input.text_content) {
      const content =
        (input.html_content ?? '') + ' ' + (input.text_content ?? '');
      variables = extractTemplateVariables(content);
    }

    const updated = await this.db.email_templates.update({
      where: { id },
      data: {
        ...input,
        ...(variables && { variables }),
        updated_at: new Date(),
      },
    });

    return updated as EmailTemplate;
  }

  /**
   * Delete a template
   */
  async delete(id: string): Promise<void> {
    await this.db.email_templates.delete({
      where: { id },
    });
  }

  /**
   * Render a template with variables
   */
  async render(
    templateId: string,
    variables: TemplateVariables
  ): Promise<{ subject: string; html: string; text: string | null }> {
    const template = await this.getById(templateId);

    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    if (!template.is_active) {
      throw new Error(`Template is inactive: ${templateId}`);
    }

    // Validate variables
    const validation = validateTemplateVariables(template.html_content, variables);
    if (!validation.valid) {
      throw new Error(
        `Missing required variables: ${validation.missing.join(', ')}`
      );
    }

    return {
      subject: renderTemplate({ template: template.subject, variables }),
      html: renderTemplate({ template: template.html_content, variables }),
      text: template.text_content
        ? renderTemplate({ template: template.text_content, variables })
        : null,
    };
  }
}

// =====================================================
// EMAIL SENDING SERVICE
// =====================================================

export class EmailSendingService {
  constructor(private db: DatabaseClient) {}

  /**
   * Send a single email via Resend
   */
  async sendEmail(options: ResendEmailOptions): Promise<{
    success: boolean;
    message_id?: string;
    error?: string;
  }> {
    try {
      const emailOptions: Record<string, any> = {
        from: options.from,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
      };

      if (options.html) emailOptions.html = options.html;
      if (options.text) emailOptions.text = options.text;
      if (options.reply_to) emailOptions.replyTo = options.reply_to;
      if (options.tags) emailOptions.tags = options.tags;
      if (options.headers) emailOptions.headers = options.headers;

      const response = await resend.emails.send(emailOptions as any);

      if ('id' in response.data!) {
        return {
          success: true,
          message_id: response.data.id,
        };
      }

      return {
        success: false,
        error: 'Unknown error from Resend',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message ?? 'Failed to send email',
      };
    }
  }

  /**
   * Queue an email for sending
   */
  async queueEmail(input: CreateEmailQueueInput): Promise<string> {
    const queued = await this.db.email_queue.create({
      data: {
        recipient_email: input.recipient_email,
        template_id: input.template_id ?? null,
        subject: input.subject,
        html_content: input.html_content ?? null,
        text_content: input.text_content ?? null,
        status: 'pending',
        priority: input.priority ?? 5,
        metadata: input.metadata ?? {},
      },
    });

    return queued.id;
  }

  /**
   * Process pending emails in the queue
   * Sends up to `limit` pending emails
   */
  async processQueue(limit: number = 100): Promise<ProcessQueueResult> {
    const pendingEmails = await this.db.email_queue.findMany({
      where: { status: 'pending' },
      orderBy: [
        { priority: 'asc' }, // Lower priority number = higher priority
        { created_at: 'asc' }, // Older emails first
      ],
      take: limit,
    });

    let sent_count = 0;
    let failed_count = 0;
    const errors: Array<{ queue_id: string; error: string }> = [];

    for (const email of pendingEmails) {
      try {
        const result = await this.sendEmail({
          from: `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
          to: email.recipient_email,
          subject: email.subject,
          html: email.html_content ?? undefined,
          text: email.text_content ?? undefined,
          reply_to: DEFAULT_REPLY_TO,
        });

        if (result.success) {
          // Update queue status
          await this.db.email_queue.update({
            where: { id: email.id },
            data: {
              status: 'sent',
              provider: 'resend',
              provider_message_id: result.message_id ?? null,
              sent_at: new Date(),
            },
          });

          // Track sent event
          await this.trackEvent({
            campaign_id: email.metadata.campaign_id,
            recipient_email: email.recipient_email,
            event_type: 'sent',
            event_data: {
              queue_id: email.id,
              provider_message_id: result.message_id,
            },
          });

          sent_count++;
        } else {
          // Update with error
          await this.db.email_queue.update({
            where: { id: email.id },
            data: {
              status: 'failed',
              error_message: result.error ?? 'Unknown error',
            },
          });

          errors.push({
            queue_id: email.id,
            error: result.error ?? 'Unknown error',
          });

          failed_count++;
        }
      } catch (error: any) {
        errors.push({
          queue_id: email.id,
          error: error.message ?? 'Exception during send',
        });

        failed_count++;
      }
    }

    return {
      success: failed_count === 0,
      processed_count: pendingEmails.length,
      sent_count,
      failed_count,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Track an email event
   */
  async trackEvent(input: CreateTrackingEventInput): Promise<string> {
    const event = await this.db.email_tracking.create({
      data: {
        campaign_id: input.campaign_id ?? null,
        recipient_email: input.recipient_email ?? null,
        event_type: input.event_type,
        event_data: input.event_data ?? null,
        ip_address: input.ip_address ?? null,
        user_agent: input.user_agent ?? null,
      },
    });

    return event.id;
  }
}

// =====================================================
// EMAIL CAMPAIGN SERVICE
// =====================================================

export class EmailCampaignService {
  private templateService: EmailTemplateService;
  private sendingService: EmailSendingService;

  constructor(private db: DatabaseClient) {
    this.templateService = new EmailTemplateService(db);
    this.sendingService = new EmailSendingService(db);
  }

  /**
   * Create a new campaign
   */
  async create(
    input: CreateCampaignInput,
    userId: string
  ): Promise<EmailCampaign> {
    const campaign = await this.db.email_campaigns.create({
      data: {
        campaign_name: input.campaign_name,
        subject_line: input.subject_line,
        email_template: input.email_template,
        from_name: input.from_name ?? DEFAULT_FROM_NAME,
        from_email: input.from_email ?? DEFAULT_FROM_EMAIL,
        reply_to: input.reply_to ?? DEFAULT_REPLY_TO,
        recipient_list: input.recipient_list ?? [],
        segment_criteria: input.segment_criteria ?? null,
        scheduled_for: input.scheduled_for ?? null,
        status: input.status ?? 'draft',
        total_recipients: input.recipient_list?.length ?? 0,
        created_by: userId,
      },
    });

    return campaign as EmailCampaign;
  }

  /**
   * Get campaign by ID
   */
  async getById(id: string): Promise<EmailCampaign | null> {
    const campaign = await this.db.email_campaigns.findUnique({
      where: { id },
    });

    return campaign as EmailCampaign | null;
  }

  /**
   * List campaigns
   */
  async list(params?: {
    status?: string;
    created_by?: string;
    limit?: number;
    offset?: number;
  }): Promise<EmailCampaign[]> {
    const where: {
      status?: string;
      created_by?: string;
    } = {};

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.created_by) {
      where.created_by = params.created_by;
    }

    const campaigns = await this.db.email_campaigns.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: params?.limit,
      skip: params?.offset,
    });

    return campaigns as EmailCampaign[];
  }

  /**
   * Update a campaign
   */
  async update(id: string, input: UpdateCampaignInput): Promise<EmailCampaign> {
    const updateData: UpdateCampaignInput & { updated_at?: Date; total_recipients?: number } = { ...input };

    // Update total_recipients if recipient_list changed
    if (input.recipient_list) {
      updateData.total_recipients = input.recipient_list.length;
    }

    updateData.updated_at = new Date();

    const updated = await this.db.email_campaigns.update({
      where: { id },
      data: updateData,
    });

    return updated as EmailCampaign;
  }

  /**
   * Delete a campaign
   */
  async delete(id: string): Promise<void> {
    await this.db.email_campaigns.delete({
      where: { id },
    });
  }

  /**
   * Send a campaign immediately
   * Queues all emails and processes them
   */
  async send(campaignId: string): Promise<SendCampaignResult> {
    const campaign = await this.getById(campaignId);

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    if (campaign.status === 'sent') {
      throw new Error('Campaign already sent');
    }

    if (campaign.status === 'cancelled') {
      throw new Error('Campaign is cancelled');
    }

    // Update status to sending
    await this.update(campaignId, { status: 'sending' });

    const recipients = campaign.recipient_list as RecipientData[];
    let queued_count = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Queue all emails
    for (const recipient of recipients) {
      try {
        // Render template for this recipient
        const html = renderTemplate({
          template: campaign.email_template,
          variables: recipient,
        });

        const subject = renderTemplate({
          template: campaign.subject_line,
          variables: recipient,
        });

        await this.sendingService.queueEmail({
          recipient_email: recipient.email,
          subject,
          html_content: html,
          metadata: {
            campaign_id: campaignId,
            recipient_name: recipient.name,
          },
        });

        queued_count++;
      } catch (error: any) {
        errors.push({
          email: recipient.email,
          error: error.message ?? 'Failed to queue',
        });
      }
    }

    // Process the queue
    const result = await this.sendingService.processQueue(queued_count);

    // Update campaign with results
    await this.db.email_campaigns.update({
      where: { id: campaignId },
      data: {
        status: 'sent',
        sent_at: new Date(),
        sent_count: result.sent_count,
      },
    });

    return {
      success: result.success,
      campaign_id: campaignId,
      queued_count,
      sent_count: result.sent_count,
      failed_count: result.failed_count,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get campaign metrics
   */
  async getMetrics(campaignId: string): Promise<CampaignMetrics> {
    const campaign = await this.getById(campaignId);

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Get event counts from tracking
    const trackingData = await this.db.email_tracking.groupBy({
      by: ['event_type'],
      where: { campaign_id: campaignId },
      _count: { event_type: true },
    });

    const eventCounts: Record<string, number> = {};
    trackingData.forEach((item: { event_type: string; _count: { event_type: number } }) => {
      eventCounts[item.event_type] = item._count.event_type;
    });

    const delivered_count = eventCounts.delivered ?? 0;
    const open_count = eventCounts.opened ?? 0;
    const click_count = eventCounts.clicked ?? 0;
    const bounce_count = eventCounts.bounced ?? 0;
    const unsubscribe_count = eventCounts.unsubscribed ?? 0;
    const complaint_count = eventCounts.complained ?? 0;

    const sent_count = campaign.sent_count;

    // Calculate rates
    const delivery_rate = sent_count > 0 ? delivered_count / sent_count : 0;
    const open_rate = delivered_count > 0 ? open_count / delivered_count : 0;
    const click_rate = delivered_count > 0 ? click_count / delivered_count : 0;
    const click_to_open_rate = open_count > 0 ? click_count / open_count : 0;
    const bounce_rate = sent_count > 0 ? bounce_count / sent_count : 0;
    const unsubscribe_rate = delivered_count > 0 ? unsubscribe_count / delivered_count : 0;

    return {
      campaign_id: campaignId,
      campaign_name: campaign.campaign_name,
      total_recipients: campaign.total_recipients,
      sent_count,
      delivered_count,
      open_count,
      click_count,
      bounce_count,
      unsubscribe_count,
      complaint_count,
      delivery_rate,
      open_rate,
      click_rate,
      click_to_open_rate,
      bounce_rate,
      unsubscribe_rate,
      status: campaign.status,
      created_at: campaign.created_at,
      sent_at: campaign.sent_at,
      updated_at: campaign.updated_at,
    };
  }
}

// Services are already exported with class declarations above, no need for re-export
