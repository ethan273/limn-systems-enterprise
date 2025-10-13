/**
 * Service Templates for API Management Module
 *
 * These templates provide pre-configured settings for common third-party APIs
 * including required fields, rotation intervals, health check endpoints, and more.
 *
 * @module service-templates
 */

export type ServiceCategory =
  | 'payments'
  | 'accounting'
  | 'communications'
  | 'storage'
  | 'authentication'
  | 'documents'
  | 'logistics'
  | 'custom';

export type FieldType =
  | 'text'
  | 'password'
  | 'url'
  | 'json'
  | 'select';

export interface TemplateField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  description?: string;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  options?: Array<{ label: string; value: string }>;
}

export interface ServiceTemplate {
  value: string;
  label: string;
  category: ServiceCategory;
  description: string;
  icon?: string;

  // Credential fields
  fields: TemplateField[];

  // Security & rotation settings
  rotationDays: number;
  supportsAutoRotation: boolean;
  requiresOAuthReauth: boolean;

  // Health check settings
  healthCheckEnabled: boolean;
  healthCheckEndpoint?: string;
  healthCheckMethod?: 'GET' | 'POST';
  healthCheckExpectedStatus?: number;

  // Documentation
  documentationUrl: string;
  setupInstructions?: string;

  // Rate limiting recommendations
  recommendedRateLimit?: number; // requests per minute
  recommendedConcurrentLimit?: number;

  // AWS Secrets Manager support
  supportsSecretsManager: boolean;
}

/**
 * All available service templates
 */
export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // ===== PAYMENTS =====
  {
    value: 'stripe',
    label: 'Stripe Payments',
    category: 'payments',
    description: 'Stripe payment processing and subscription management',
    icon: '💳',
    fields: [
      {
        name: 'publishable_key',
        label: 'Publishable Key',
        type: 'text',
        required: true,
        description: 'Your Stripe publishable key (starts with pk_)',
        placeholder: 'pk_live_...',
        validation: {
          pattern: '^pk_(test|live)_[A-Za-z0-9]+$',
        },
      },
      {
        name: 'secret_key',
        label: 'Secret Key',
        type: 'password',
        required: true,
        description: 'Your Stripe secret key (starts with sk_)',
        placeholder: 'sk_live_...',
        validation: {
          pattern: '^sk_(test|live)_[A-Za-z0-9]+$',
        },
      },
      {
        name: 'webhook_secret',
        label: 'Webhook Secret',
        type: 'password',
        required: false,
        description: 'Webhook signing secret for event verification',
        placeholder: 'whsec_...',
      },
    ],
    rotationDays: 90,
    supportsAutoRotation: true,
    requiresOAuthReauth: false,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://api.stripe.com/v1/balance',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://stripe.com/docs/api',
    setupInstructions: '1. Log into Stripe Dashboard\n2. Navigate to Developers > API Keys\n3. Copy your publishable and secret keys\n4. For webhooks, go to Developers > Webhooks',
    recommendedRateLimit: 100,
    recommendedConcurrentLimit: 25,
    supportsSecretsManager: true,
  },

  // ===== ACCOUNTING =====
  {
    value: 'quickbooks',
    label: 'QuickBooks Online',
    category: 'accounting',
    description: 'QuickBooks accounting integration for invoices, payments, and financial data',
    icon: '📊',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Your QuickBooks OAuth Client ID',
        placeholder: 'AB...',
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'Your QuickBooks OAuth Client Secret',
        placeholder: '',
      },
      {
        name: 'realm_id',
        label: 'Realm ID (Company ID)',
        type: 'text',
        required: true,
        description: 'QuickBooks company/realm ID',
        placeholder: '1234567890',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        description: 'Sandbox or Production environment',
        options: [
          { label: 'Production', value: 'production' },
          { label: 'Sandbox', value: 'sandbox' },
        ],
      },
    ],
    rotationDays: 180,
    supportsAutoRotation: false,
    requiresOAuthReauth: true,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://quickbooks.api.intuit.com/v3/company/{realm_id}/companyinfo/{realm_id}',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://developer.intuit.com/app/developer/qbo/docs/get-started',
    setupInstructions: '1. Go to Intuit Developer Portal\n2. Create a new app\n3. Get OAuth credentials\n4. Set up redirect URIs',
    recommendedRateLimit: 500,
    recommendedConcurrentLimit: 10,
    supportsSecretsManager: false,
  },

  {
    value: 'quickbooks_payments',
    label: 'QuickBooks Payments',
    category: 'payments',
    description: 'QuickBooks Payments for processing credit card and ACH transactions',
    icon: '💰',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Your QuickBooks Payments OAuth Client ID',
        placeholder: 'AB...',
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'Your QuickBooks Payments OAuth Client Secret',
        placeholder: '',
      },
      {
        name: 'merchant_id',
        label: 'Merchant ID',
        type: 'text',
        required: true,
        description: 'Your QuickBooks Payments Merchant ID',
        placeholder: '',
      },
      {
        name: 'environment',
        label: 'Environment',
        type: 'select',
        required: true,
        description: 'Sandbox or Production environment',
        options: [
          { label: 'Production', value: 'production' },
          { label: 'Sandbox', value: 'sandbox' },
        ],
      },
    ],
    rotationDays: 180,
    supportsAutoRotation: false,
    requiresOAuthReauth: true,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://api.intuit.com/quickbooks/v4/payments/charges',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://developer.intuit.com/app/developer/qbpayments/docs/get-started',
    setupInstructions: '1. Go to Intuit Developer Portal\n2. Enable QuickBooks Payments API\n3. Get OAuth credentials\n4. Obtain Merchant ID from settings',
    recommendedRateLimit: 300,
    recommendedConcurrentLimit: 10,
    supportsSecretsManager: false,
  },

  // ===== COMMUNICATIONS =====
  {
    value: 'twilio',
    label: 'Twilio SMS/Voice',
    category: 'communications',
    description: 'Twilio SMS, voice calls, and WhatsApp messaging',
    icon: '📱',
    fields: [
      {
        name: 'account_sid',
        label: 'Account SID',
        type: 'text',
        required: true,
        description: 'Your Twilio Account SID',
        placeholder: 'AC...',
        validation: {
          pattern: '^AC[a-f0-9]{32}$',
        },
      },
      {
        name: 'auth_token',
        label: 'Auth Token',
        type: 'password',
        required: true,
        description: 'Your Twilio Auth Token',
        placeholder: '',
        validation: {
          minLength: 32,
          maxLength: 32,
        },
      },
      {
        name: 'phone_number',
        label: 'Phone Number',
        type: 'text',
        required: false,
        description: 'Your Twilio phone number (E.164 format)',
        placeholder: '+1234567890',
      },
    ],
    rotationDays: 90,
    supportsAutoRotation: true,
    requiresOAuthReauth: false,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://api.twilio.com/2010-04-01/Accounts/{account_sid}.json',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://www.twilio.com/docs/usage/api',
    setupInstructions: '1. Log into Twilio Console\n2. Navigate to Account > API Keys\n3. Copy Account SID and Auth Token\n4. Optionally set up a phone number',
    recommendedRateLimit: 100,
    recommendedConcurrentLimit: 10,
    supportsSecretsManager: true,
  },

  {
    value: 'sendgrid',
    label: 'SendGrid Email',
    category: 'communications',
    description: 'SendGrid transactional and marketing email platform',
    icon: '📧',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Your SendGrid API Key',
        placeholder: 'SG...',
        validation: {
          pattern: '^SG\\.[A-Za-z0-9_-]{22}\\.[A-Za-z0-9_-]{43}$',
        },
      },
      {
        name: 'from_email',
        label: 'Default From Email',
        type: 'text',
        required: false,
        description: 'Default sender email address',
        placeholder: 'noreply@example.com',
      },
      {
        name: 'from_name',
        label: 'Default From Name',
        type: 'text',
        required: false,
        description: 'Default sender name',
        placeholder: 'Your Company',
      },
    ],
    rotationDays: 90,
    supportsAutoRotation: true,
    requiresOAuthReauth: false,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://api.sendgrid.com/v3/scopes',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://docs.sendgrid.com/api-reference',
    setupInstructions: '1. Log into SendGrid Dashboard\n2. Navigate to Settings > API Keys\n3. Create a new API key with appropriate permissions\n4. Copy the API key immediately',
    recommendedRateLimit: 600,
    recommendedConcurrentLimit: 50,
    supportsSecretsManager: true,
  },

  // ===== STORAGE =====
  {
    value: 'aws_s3',
    label: 'AWS S3',
    category: 'storage',
    description: 'Amazon S3 object storage for files and backups',
    icon: '🪣',
    fields: [
      {
        name: 'access_key_id',
        label: 'Access Key ID',
        type: 'text',
        required: true,
        description: 'AWS IAM Access Key ID',
        placeholder: 'AKIA...',
        validation: {
          pattern: '^AKIA[A-Z0-9]{16}$',
        },
      },
      {
        name: 'secret_access_key',
        label: 'Secret Access Key',
        type: 'password',
        required: true,
        description: 'AWS IAM Secret Access Key',
        placeholder: '',
        validation: {
          minLength: 40,
          maxLength: 40,
        },
      },
      {
        name: 'region',
        label: 'AWS Region',
        type: 'select',
        required: true,
        description: 'AWS region for S3 bucket',
        options: [
          { label: 'US East (N. Virginia) - us-east-1', value: 'us-east-1' },
          { label: 'US East (Ohio) - us-east-2', value: 'us-east-2' },
          { label: 'US West (N. California) - us-west-1', value: 'us-west-1' },
          { label: 'US West (Oregon) - us-west-2', value: 'us-west-2' },
          { label: 'Europe (Ireland) - eu-west-1', value: 'eu-west-1' },
          { label: 'Europe (London) - eu-west-2', value: 'eu-west-2' },
          { label: 'Asia Pacific (Singapore) - ap-southeast-1', value: 'ap-southeast-1' },
          { label: 'Asia Pacific (Sydney) - ap-southeast-2', value: 'ap-southeast-2' },
        ],
      },
      {
        name: 'bucket_name',
        label: 'Bucket Name',
        type: 'text',
        required: false,
        description: 'Default S3 bucket name',
        placeholder: 'my-bucket',
      },
    ],
    rotationDays: 90,
    supportsAutoRotation: true,
    requiresOAuthReauth: false,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://sts.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://docs.aws.amazon.com/s3/',
    setupInstructions: '1. Log into AWS Console\n2. Navigate to IAM > Users\n3. Create new user or select existing\n4. Create access keys\n5. Attach S3 policies',
    recommendedRateLimit: 3500,
    recommendedConcurrentLimit: 100,
    supportsSecretsManager: true,
  },

  // ===== AUTHENTICATION =====
  {
    value: 'google_oauth',
    label: 'Google OAuth 2.0',
    category: 'authentication',
    description: 'Google OAuth for authentication and Google API access',
    icon: '🔐',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Google OAuth Client ID',
        placeholder: '123456789-abc123.apps.googleusercontent.com',
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'Google OAuth Client Secret',
        placeholder: 'GOCSPX-...',
      },
      {
        name: 'redirect_uri',
        label: 'Redirect URI',
        type: 'url',
        required: true,
        description: 'OAuth redirect URI configured in Google Console',
        placeholder: 'https://yourdomain.com/auth/google/callback',
      },
    ],
    rotationDays: 180,
    supportsAutoRotation: false,
    requiresOAuthReauth: true,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://www.googleapis.com/oauth2/v1/tokeninfo',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://developers.google.com/identity/protocols/oauth2',
    setupInstructions: '1. Go to Google Cloud Console\n2. Create or select a project\n3. Enable required APIs\n4. Create OAuth credentials\n5. Configure consent screen',
    recommendedRateLimit: 10000,
    recommendedConcurrentLimit: 50,
    supportsSecretsManager: false,
  },

  {
    value: 'google_drive',
    label: 'Google Drive API',
    category: 'storage',
    description: 'Google Drive for file storage and sharing',
    icon: '📁',
    fields: [
      {
        name: 'client_id',
        label: 'Client ID',
        type: 'text',
        required: true,
        description: 'Google OAuth Client ID',
        placeholder: '123456789-abc123.apps.googleusercontent.com',
      },
      {
        name: 'client_secret',
        label: 'Client Secret',
        type: 'password',
        required: true,
        description: 'Google OAuth Client Secret',
        placeholder: 'GOCSPX-...',
      },
      {
        name: 'service_account_email',
        label: 'Service Account Email',
        type: 'text',
        required: false,
        description: 'Service account email (for server-to-server auth)',
        placeholder: 'service-account@project.iam.gserviceaccount.com',
      },
    ],
    rotationDays: 180,
    supportsAutoRotation: false,
    requiresOAuthReauth: true,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://www.googleapis.com/drive/v3/about',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://developers.google.com/drive/api/guides/about-sdk',
    setupInstructions: '1. Go to Google Cloud Console\n2. Enable Google Drive API\n3. Create OAuth credentials or service account\n4. Download credentials JSON',
    recommendedRateLimit: 12000,
    recommendedConcurrentLimit: 50,
    supportsSecretsManager: false,
  },

  // ===== DOCUMENTS =====
  {
    value: 'pandadoc',
    label: 'PandaDoc',
    category: 'documents',
    description: 'PandaDoc for document generation, e-signatures, and contract management',
    icon: '📄',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Your PandaDoc API Key',
        placeholder: '',
      },
    ],
    rotationDays: 90,
    supportsAutoRotation: false,
    requiresOAuthReauth: false,
    healthCheckEnabled: true,
    healthCheckEndpoint: 'https://api.pandadoc.com/public/v1/documents',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://developers.pandadoc.com/reference/about',
    setupInstructions: '1. Log into PandaDoc Dashboard\n2. Navigate to Settings > API Settings\n3. Generate a new API key\n4. Copy the key immediately',
    recommendedRateLimit: 60,
    recommendedConcurrentLimit: 10,
    supportsSecretsManager: false,
  },

  // ===== LOGISTICS =====
  {
    value: 'seiko_logistics',
    label: 'Seiko Logistics',
    category: 'logistics',
    description: 'Seiko Logistics API for shipping and tracking',
    icon: '🚚',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: true,
        description: 'Your Seiko Logistics API Key',
        placeholder: '',
      },
      {
        name: 'api_endpoint',
        label: 'API Endpoint',
        type: 'url',
        required: true,
        description: 'Seiko Logistics API endpoint URL',
        placeholder: 'https://api.seikologistics.com/v1',
      },
      {
        name: 'account_number',
        label: 'Account Number',
        type: 'text',
        required: false,
        description: 'Your Seiko Logistics account number',
        placeholder: '',
      },
    ],
    rotationDays: 180,
    supportsAutoRotation: false,
    requiresOAuthReauth: false,
    healthCheckEnabled: true,
    healthCheckEndpoint: '{api_endpoint}/health',
    healthCheckMethod: 'GET',
    healthCheckExpectedStatus: 200,
    documentationUrl: 'https://seikologistics.com/api-docs',
    setupInstructions: '1. Contact Seiko Logistics support\n2. Request API access\n3. Receive API key via secure channel\n4. Configure endpoint URL',
    recommendedRateLimit: 100,
    recommendedConcurrentLimit: 10,
    supportsSecretsManager: false,
  },

  // ===== CUSTOM =====
  {
    value: 'custom',
    label: 'Custom API',
    category: 'custom',
    description: 'Custom API credentials for any other service',
    icon: '⚙️',
    fields: [
      {
        name: 'api_key',
        label: 'API Key',
        type: 'password',
        required: false,
        description: 'API key or token',
        placeholder: '',
      },
      {
        name: 'api_secret',
        label: 'API Secret',
        type: 'password',
        required: false,
        description: 'API secret (if required)',
        placeholder: '',
      },
      {
        name: 'api_endpoint',
        label: 'API Endpoint',
        type: 'url',
        required: false,
        description: 'Base API endpoint URL',
        placeholder: 'https://api.example.com',
      },
      {
        name: 'additional_config',
        label: 'Additional Configuration',
        type: 'json',
        required: false,
        description: 'Any additional configuration (JSON format)',
        placeholder: '{"key": "value"}',
      },
    ],
    rotationDays: 90,
    supportsAutoRotation: false,
    requiresOAuthReauth: false,
    healthCheckEnabled: false,
    documentationUrl: '',
    setupInstructions: 'Refer to your API provider documentation for setup instructions.',
    supportsSecretsManager: false,
  },
];

/**
 * Get template by value
 */
export function getTemplate(value: string): ServiceTemplate | undefined {
  return SERVICE_TEMPLATES.find((t) => t.value === value);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: ServiceCategory): ServiceTemplate[] {
  return SERVICE_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique categories
 */
export function getCategories(): ServiceCategory[] {
  return Array.from(new Set(SERVICE_TEMPLATES.map((t) => t.category)));
}

/**
 * Get templates that support auto-rotation
 */
export function getAutoRotatableTemplates(): ServiceTemplate[] {
  return SERVICE_TEMPLATES.filter((t) => t.supportsAutoRotation);
}

/**
 * Get templates that support AWS Secrets Manager
 */
export function getSecretsManagerTemplates(): ServiceTemplate[] {
  return SERVICE_TEMPLATES.filter((t) => t.supportsSecretsManager);
}
