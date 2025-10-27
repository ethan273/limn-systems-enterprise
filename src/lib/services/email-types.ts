/**
 * Email System Types
 *
 * Type definitions for the email campaign system
 *
 * @module email-types
 * @created 2025-10-26
 * @phase Grand Plan Phase 5
 */

// =====================================================
// EMAIL TEMPLATE TYPES
// =====================================================

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  variables: string[];
  language: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateEmailTemplateInput {
  template_key: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
  language?: string;
  is_active?: boolean;
}

export interface UpdateEmailTemplateInput {
  name?: string;
  subject?: string;
  html_content?: string;
  text_content?: string;
  variables?: string[];
  language?: string;
  is_active?: boolean;
}

// =====================================================
// EMAIL CAMPAIGN TYPES
// =====================================================

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';

export interface EmailCampaign {
  id: string;
  campaign_name: string;
  subject_line: string;
  email_template: string;
  from_name: string | null;
  from_email: string | null;
  reply_to: string | null;
  recipient_list: RecipientData[];
  segment_criteria: Record<string, any> | null;
  scheduled_for: Date | null;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  created_by: string | null;
  created_at: Date;
  sent_at: Date | null;
  updated_at: Date;
}

export interface RecipientData {
  email: string;
  name?: string;
  [key: string]: any; // Additional merge variables
}

export interface CreateCampaignInput {
  campaign_name: string;
  subject_line: string;
  email_template: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  recipient_list?: RecipientData[];
  segment_criteria?: Record<string, any>;
  scheduled_for?: Date;
  status?: CampaignStatus;
}

export interface UpdateCampaignInput {
  campaign_name?: string;
  subject_line?: string;
  email_template?: string;
  from_name?: string;
  from_email?: string;
  reply_to?: string;
  recipient_list?: RecipientData[];
  segment_criteria?: Record<string, any>;
  scheduled_for?: Date;
  status?: CampaignStatus;
}

// =====================================================
// EMAIL QUEUE TYPES
// =====================================================

export type EmailQueueStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface EmailQueueItem {
  id: string;
  recipient_email: string;
  template_id: string | null;
  subject: string;
  html_content: string | null;
  text_content: string | null;
  status: EmailQueueStatus;
  provider: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: Date | null;
  delivered_at: Date | null;
  priority: number;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface CreateEmailQueueInput {
  campaign_id?: string;
  recipient_email: string;
  template_id?: string;
  subject: string;
  html_content?: string;
  text_content?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

// =====================================================
// EMAIL TRACKING TYPES
// =====================================================

export type EmailEventType =
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'unsubscribed'
  | 'complained';

export interface EmailTrackingEvent {
  id: string;
  campaign_id: string | null;
  recipient_email: string | null;
  event_type: EmailEventType;
  event_data: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

export interface CreateTrackingEventInput {
  campaign_id?: string;
  recipient_email?: string;
  event_type: EmailEventType;
  event_data?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// =====================================================
// RESEND API TYPES
// =====================================================

export interface ResendEmailOptions {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
}

export interface ResendResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

export interface ResendError {
  statusCode: number;
  message: string;
  name: string;
}

// =====================================================
// TEMPLATE RENDERING TYPES
// =====================================================

export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

export interface RenderTemplateOptions {
  template: string;
  variables: TemplateVariables;
  /** If true, throws error on missing variables. If false, replaces with empty string. */
  strict?: boolean;
}

// =====================================================
// CAMPAIGN ANALYTICS TYPES
// =====================================================

export interface CampaignMetrics {
  campaign_id: string;
  campaign_name: string;
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  complaint_count: number;

  // Calculated rates
  delivery_rate: number; // delivered / sent
  open_rate: number; // opened / delivered
  click_rate: number; // clicked / delivered
  click_to_open_rate: number; // clicked / opened
  bounce_rate: number; // bounced / sent
  unsubscribe_rate: number; // unsubscribed / delivered

  status: CampaignStatus;
  created_at: Date;
  sent_at: Date | null;
  updated_at: Date;
}

export interface CampaignAnalytics {
  metrics: CampaignMetrics;
  timeline: TimelineEvent[];
  topLinks: LinkClick[];
  deviceBreakdown: DeviceStats[];
  locationBreakdown: LocationStats[];
}

export interface TimelineEvent {
  timestamp: Date;
  event_type: EmailEventType;
  count: number;
}

export interface LinkClick {
  url: string;
  click_count: number;
  unique_clicks: number;
}

export interface DeviceStats {
  device_type: string; // desktop, mobile, tablet
  count: number;
  percentage: number;
}

export interface LocationStats {
  country?: string;
  city?: string;
  count: number;
  percentage: number;
}

// =====================================================
// SERVICE RESPONSE TYPES
// =====================================================

export interface SendCampaignResult {
  success: boolean;
  campaign_id: string;
  queued_count: number;
  sent_count: number;
  failed_count: number;
  errors?: Array<{ email: string; error: string }>;
}

export interface ProcessQueueResult {
  success: boolean;
  processed_count: number;
  sent_count: number;
  failed_count: number;
  errors?: Array<{ queue_id: string; error: string }>;
}
