import fs from 'fs';
import path from 'path';

export interface DetectedAPIKey {
  service: string;
  displayName: string;
  keys: Record<string, string>;
  source: 'env' | 'env.local';
  isConfigured: boolean;
}

export interface RecommendedAPI {
  service: string;
  displayName: string;
  description: string;
  requiredKeys: string[];
  isConfigured: boolean;
}

/**
 * Parse .env file and extract API-related keys
 */
function parseEnvFile(filePath: string): Record<string, string> {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const envVars: Record<string, string> = {};

    content.split('\n').forEach((line) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }

      // Parse KEY=VALUE format
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();

        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }

        envVars[key] = value;
      }
    });

    return envVars;
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error);
    return {};
  }
}

/**
 * Scan environment files for API keys
 */
export function scanEnvironmentForAPIKeys(): DetectedAPIKey[] {
  const projectRoot = process.cwd();
  const envPath = path.join(projectRoot, '.env');
  const envLocalPath = path.join(projectRoot, '.env.local');

  const envVars = parseEnvFile(envPath);
  const envLocalVars = parseEnvFile(envLocalPath);

  // Merge both files, with .env.local taking precedence
  const allVars = { ...envVars, ...envLocalVars };

  const detected: DetectedAPIKey[] = [];

  // QuickBooks
  const qbKeys = ['QUICKBOOKS_CLIENT_ID', 'QUICKBOOKS_CLIENT_SECRET', 'QUICKBOOKS_REDIRECT_URI'];
  const qbDetected = qbKeys.filter(key => allVars[key]);
  if (qbDetected.length > 0) {
    detected.push({
      service: 'quickbooks',
      displayName: 'QuickBooks Online',
      keys: Object.fromEntries(qbDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[qbDetected[0]] ? 'env.local' : 'env',
      isConfigured: qbDetected.length === qbKeys.length,
    });
  }

  // SEKO Logistics
  const sekoKeys = ['SEKO_API_KEY', 'SEKO_API_SECRET', 'SEKO_ACCOUNT_ID', 'SEKO_ENVIRONMENT'];
  const sekoDetected = sekoKeys.filter(key => allVars[key]);
  if (sekoDetected.length > 0) {
    detected.push({
      service: 'seko_logistics',
      displayName: 'SEKO Logistics',
      keys: Object.fromEntries(sekoDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[sekoDetected[0]] ? 'env.local' : 'env',
      isConfigured: sekoDetected.length >= 3, // API key, secret, and account ID are minimum
    });
  }

  // Google Drive / Google OAuth
  const googleKeys = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI'];
  const googleDetected = googleKeys.filter(key => allVars[key]);
  if (googleDetected.length > 0) {
    detected.push({
      service: 'google_drive',
      displayName: 'Google Drive',
      keys: Object.fromEntries(googleDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[googleDetected[0]] ? 'env.local' : 'env',
      isConfigured: googleDetected.length === googleKeys.length,
    });
  }

  // Stripe
  const stripeKeys = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const stripeDetected = stripeKeys.filter(key => allVars[key]);
  if (stripeDetected.length > 0) {
    detected.push({
      service: 'stripe',
      displayName: 'Stripe',
      keys: Object.fromEntries(stripeDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[stripeDetected[0]] ? 'env.local' : 'env',
      isConfigured: stripeDetected.length >= 2, // Secret and publishable are minimum
    });
  }

  // SendGrid
  const sendgridKeys = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL'];
  const sendgridDetected = sendgridKeys.filter(key => allVars[key]);
  if (sendgridDetected.length > 0) {
    detected.push({
      service: 'sendgrid',
      displayName: 'SendGrid',
      keys: Object.fromEntries(sendgridDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[sendgridDetected[0]] ? 'env.local' : 'env',
      isConfigured: sendgridDetected.length === sendgridKeys.length,
    });
  }

  // Twilio
  const twilioKeys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'];
  const twilioDetected = twilioKeys.filter(key => allVars[key]);
  if (twilioDetected.length > 0) {
    detected.push({
      service: 'twilio',
      displayName: 'Twilio',
      keys: Object.fromEntries(twilioDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[twilioDetected[0]] ? 'env.local' : 'env',
      isConfigured: twilioDetected.length === twilioKeys.length,
    });
  }

  // AWS S3
  const awsKeys = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'AWS_S3_BUCKET'];
  const awsDetected = awsKeys.filter(key => allVars[key]);
  if (awsDetected.length > 0) {
    detected.push({
      service: 'aws_s3',
      displayName: 'AWS S3',
      keys: Object.fromEntries(awsDetected.map(key => [key, allVars[key]])),
      source: envLocalVars[awsDetected[0]] ? 'env.local' : 'env',
      isConfigured: awsDetected.length >= 3, // Access key, secret, and region are minimum
    });
  }

  return detected;
}

/**
 * Get list of recommended APIs for the platform
 */
export function getRecommendedAPIs(detectedKeys: DetectedAPIKey[]): RecommendedAPI[] {
  const detectedServices = new Set(detectedKeys.map(k => k.service));

  const recommendations: RecommendedAPI[] = [
    {
      service: 'quickbooks',
      displayName: 'QuickBooks Online',
      description: 'Accounting integration for invoicing and financial reporting',
      requiredKeys: ['client_id', 'client_secret', 'redirect_uri'],
      isConfigured: detectedServices.has('quickbooks'),
    },
    {
      service: 'seko_logistics',
      displayName: 'SEKO Logistics',
      description: 'Shipping and logistics integration for order tracking',
      requiredKeys: ['api_key', 'api_secret', 'account_id'],
      isConfigured: detectedServices.has('seko_logistics'),
    },
    {
      service: 'google_drive',
      displayName: 'Google Drive',
      description: 'Document storage and collaboration',
      requiredKeys: ['client_id', 'client_secret', 'redirect_uri'],
      isConfigured: detectedServices.has('google_drive'),
    },
    {
      service: 'stripe',
      displayName: 'Stripe',
      description: 'Payment processing for customer transactions',
      requiredKeys: ['secret_key', 'publishable_key'],
      isConfigured: detectedServices.has('stripe'),
    },
    {
      service: 'sendgrid',
      displayName: 'SendGrid',
      description: 'Email delivery service for notifications and communications',
      requiredKeys: ['api_key', 'from_email'],
      isConfigured: detectedServices.has('sendgrid'),
    },
    {
      service: 'twilio',
      displayName: 'Twilio',
      description: 'SMS and voice communications',
      requiredKeys: ['account_sid', 'auth_token', 'phone_number'],
      isConfigured: detectedServices.has('twilio'),
    },
  ];

  return recommendations;
}
