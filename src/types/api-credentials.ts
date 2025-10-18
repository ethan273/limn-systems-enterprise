/**
 * Shared type definitions for API Credentials
 * Used by both tRPC routers and client components
 */

/**
 * API Credential as returned by the getAll endpoint (with masked credentials)
 */
export interface ApiCredentialWithRelations {
  id: string;
  service_name: string;
  display_name: string;
  description: string | null;
  credential_type: string;
  credentials: Record<string, string>; // Masked credentials
  environment: string | null;
  is_active: boolean;
  last_used_at: Date | null;
  expires_at: Date | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
  auto_rotation_enabled: boolean;
  aws_region: string | null;
  azure_key_vault_id: string | null;
  last_rotated_at: Date | null;
  next_rotation_at: Date | null;
  rotation_interval_days: number;
  service_template: string | null;
  // Relations
  users_api_credentials_created_byTousers?: {
    email: string | null;
    id: string;
  } | null;
  users_api_credentials_updated_byTousers?: {
    email: string | null;
    id: string;
  } | null;
}

/**
 * Type guard to check if credential has the expected structure
 */
export function isApiCredential(obj: unknown): obj is ApiCredentialWithRelations {
  if (!obj || typeof obj !== 'object') return false;
  const cred = obj as Record<string, unknown>;
  return (
    typeof cred.id === 'string' &&
    typeof cred.service_name === 'string' &&
    typeof cred.display_name === 'string' &&
    typeof cred.is_active === 'boolean' &&
    cred.created_at instanceof Date
  );
}
