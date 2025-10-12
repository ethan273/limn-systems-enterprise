/**
 * AWS Secrets Manager Integration
 *
 * Provides secure storage and retrieval of API credentials using AWS Secrets Manager.
 * Supports automatic rotation, cost tracking, and audit logging.
 */

import {
  SecretsManagerClient,
  CreateSecretCommand,
  GetSecretValueCommand,
  UpdateSecretCommand,
  DeleteSecretCommand,
  DescribeSecretCommand,
  ListSecretsCommand,
  PutSecretValueCommand,
  RotateSecretCommand,
  type CreateSecretCommandInput,
  type GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';

// Lazy initialization of AWS client
let _client: SecretsManagerClient | null = null;

function getClient(): SecretsManagerClient {
  if (!_client) {
    _client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }
  return _client;
}

/**
 * Check if AWS Secrets Manager is enabled and configured
 */
export function isAWSEnabled(): boolean {
  return !!(
    process.env.AWS_SECRETS_ENABLED === 'true' &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION
  );
}

/**
 * Store a new secret in AWS Secrets Manager
 */
export interface CreateSecretOptions {
  name: string;
  secret: Record<string, unknown>;
  description?: string;
  automaticRotation?: boolean;
  rotationDays?: number;
  tags?: Record<string, string>;
}

export async function createAWSSecret(options: CreateSecretOptions): Promise<string> {
  try {
    const { name, secret, description, automaticRotation, rotationDays = 90, tags } = options;

    const input: CreateSecretCommandInput = {
      Name: name,
      Description: description || `API credential for ${name}`,
      SecretString: JSON.stringify(secret),
      Tags: tags
        ? Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
        : [
            { Key: 'ManagedBy', Value: 'LimnSystems' },
            { Key: 'Environment', Value: process.env.NODE_ENV || 'development' },
          ],
    };

    const command = new CreateSecretCommand(input);
    const response = await getClient().send(command);

    // If automatic rotation is enabled, configure it
    if (automaticRotation && response.ARN) {
      await enableAutomaticRotation(response.ARN, rotationDays);
    }

    return response.ARN!;
  } catch (error) {
    console.error('[AWS Secrets Manager] Error creating secret:', error);
    throw new Error(`Failed to create AWS secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Retrieve a secret from AWS Secrets Manager
 */
export async function getAWSSecret(secretId: string): Promise<Record<string, unknown>> {
  try {
    const command = new GetSecretValueCommand({ SecretId: secretId });
    const response: GetSecretValueCommandOutput = await getClient().send(command);

    if (!response.SecretString) {
      throw new Error('Secret value not found');
    }

    return JSON.parse(response.SecretString);
  } catch (error) {
    console.error('[AWS Secrets Manager] Error retrieving secret:', error);
    throw new Error(`Failed to retrieve AWS secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an existing secret in AWS Secrets Manager
 */
export async function updateAWSSecret(
  secretId: string,
  newSecret: Record<string, unknown>
): Promise<void> {
  try {
    const command = new PutSecretValueCommand({
      SecretId: secretId,
      SecretString: JSON.stringify(newSecret),
    });

    await getClient().send(command);
  } catch (error) {
    console.error('[AWS Secrets Manager] Error updating secret:', error);
    throw new Error(`Failed to update AWS secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete a secret from AWS Secrets Manager
 */
export async function deleteAWSSecret(secretId: string, forceDelete = false): Promise<void> {
  try {
    const command = new DeleteSecretCommand({
      SecretId: secretId,
      ForceDeleteWithoutRecovery: forceDelete,
      RecoveryWindowInDays: forceDelete ? undefined : 30, // 30-day recovery window
    });

    await getClient().send(command);
  } catch (error) {
    console.error('[AWS Secrets Manager] Error deleting secret:', error);
    throw new Error(`Failed to delete AWS secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get secret metadata (without retrieving the actual secret)
 */
export async function getAWSSecretMetadata(secretId: string) {
  try {
    const command = new DescribeSecretCommand({ SecretId: secretId });
    const response = await getClient().send(command);

    return {
      arn: response.ARN,
      name: response.Name,
      description: response.Description,
      createdDate: response.CreatedDate,
      lastAccessedDate: response.LastAccessedDate,
      lastChangedDate: response.LastChangedDate,
      lastRotatedDate: response.LastRotatedDate,
      nextRotationDate: response.NextRotationDate,
      rotationEnabled: response.RotationEnabled || false,
      rotationRules: response.RotationRules,
      tags: response.Tags?.reduce((acc, tag) => {
        if (tag.Key) acc[tag.Key] = tag.Value || '';
        return acc;
      }, {} as Record<string, string>),
    };
  } catch (error) {
    console.error('[AWS Secrets Manager] Error getting secret metadata:', error);
    throw new Error(`Failed to get AWS secret metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enable automatic rotation for a secret
 */
export async function enableAutomaticRotation(
  secretId: string,
  rotationDays: number = 90
): Promise<void> {
  try {
    const command = new RotateSecretCommand({
      SecretId: secretId,
      RotationRules: {
        AutomaticallyAfterDays: rotationDays,
      },
    });

    await getClient().send(command);
    console.log(`[AWS Secrets Manager] Enabled automatic rotation for ${secretId} (every ${rotationDays} days)`);
  } catch (error) {
    console.error('[AWS Secrets Manager] Error enabling rotation:', error);
    // Don't throw - rotation is optional
    console.warn('Automatic rotation could not be enabled. You may need to set up a Lambda rotation function.');
  }
}

/**
 * Manually trigger rotation of a secret
 */
export async function rotateAWSSecretNow(secretId: string): Promise<void> {
  try {
    const command = new RotateSecretCommand({
      SecretId: secretId,
      RotateImmediately: true,
    });

    await getClient().send(command);
  } catch (error) {
    console.error('[AWS Secrets Manager] Error rotating secret:', error);
    throw new Error(`Failed to rotate AWS secret: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * List all secrets (with optional filtering)
 */
export async function listAWSSecrets(prefix?: string) {
  try {
    const command = new ListSecretsCommand({
      Filters: prefix
        ? [
            {
              Key: 'name',
              Values: [`${prefix}*`],
            },
          ]
        : undefined,
    });

    const response = await getClient().send(command);

    return (
      response.SecretList?.map((secret) => ({
        arn: secret.ARN,
        name: secret.Name,
        description: secret.Description,
        createdDate: secret.CreatedDate,
        lastAccessedDate: secret.LastAccessedDate,
        lastChangedDate: secret.LastChangedDate,
        lastRotatedDate: secret.LastRotatedDate,
        rotationEnabled: secret.RotationEnabled || false,
        tags: secret.Tags?.reduce((acc, tag) => {
          if (tag.Key) acc[tag.Key] = tag.Value || '';
          return acc;
        }, {} as Record<string, string>),
      })) || []
    );
  } catch (error) {
    console.error('[AWS Secrets Manager] Error listing secrets:', error);
    throw new Error(`Failed to list AWS secrets: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculate estimated monthly cost for AWS Secrets Manager usage
 */
export interface AWSCostEstimate {
  secretsCount: number;
  storageCost: number; // $0.40 per secret per month
  apiCalls: number;
  apiCallCost: number; // $0.05 per 10,000 API calls
  totalMonthlyCost: number;
}

export function calculateAWSCost(secretsCount: number, monthlyApiCalls: number): AWSCostEstimate {
  const COST_PER_SECRET = 0.4; // $0.40/month
  const COST_PER_10K_CALLS = 0.05; // $0.05/10k calls

  const storageCost = secretsCount * COST_PER_SECRET;
  const apiCallCost = (monthlyApiCalls / 10000) * COST_PER_10K_CALLS;

  return {
    secretsCount,
    storageCost: Number(storageCost.toFixed(2)),
    apiCalls: monthlyApiCalls,
    apiCallCost: Number(apiCallCost.toFixed(2)),
    totalMonthlyCost: Number((storageCost + apiCallCost).toFixed(2)),
  };
}

/**
 * Test AWS connection and permissions
 */
export async function testAWSConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    if (!isAWSEnabled()) {
      return {
        success: false,
        message: 'AWS Secrets Manager is not enabled. Check environment variables.',
      };
    }

    // Try to list secrets as a connection test
    const command = new ListSecretsCommand({ MaxResults: 1 });
    await getClient().send(command);

    return {
      success: true,
      message: 'AWS Secrets Manager connection successful',
      details: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 8) + '...',
      },
    };
  } catch (error) {
    return {
      success: false,
      message: 'AWS Secrets Manager connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Format secret name for consistency
 */
export function formatSecretName(serviceName: string, environment: string = 'production'): string {
  return `limn-systems/api-credentials/${environment}/${serviceName}`;
}

/**
 * Parse ARN to extract secret name and region
 */
export function parseSecretARN(arn: string): {
  region: string;
  accountId: string;
  secretName: string;
} | null {
  // ARN format: arn:aws:secretsmanager:region:account-id:secret:name
  const match = arn.match(/^arn:aws:secretsmanager:([^:]+):([^:]+):secret:(.+)$/);

  if (!match) return null;

  return {
    region: match[1],
    accountId: match[2],
    secretName: match[3],
  };
}
