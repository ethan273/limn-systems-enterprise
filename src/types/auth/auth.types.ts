// Authentication Types and Interfaces

export enum UserRole {
  _SUPER_ADMIN = 'super_admin',     // Limn employees - full system access
  _CLIENT_ADMIN = 'client_admin',   // Client company owner
  _CLIENT_USER = 'client_user',     // Regular client employees
  _PARTNER = 'partner',              // Designers/manufacturers
  _VIEWER = 'viewer'                 // Read-only access
}

export enum AuthProvider {
  _GOOGLE = 'google',
  _EMAIL = 'email',
  _MAGIC_LINK = 'magic_link'
}

export enum UserStatus {
  _PENDING_APPROVAL = 'pending_approval',
  _ACTIVE = 'active',
  _SUSPENDED = 'suspended',
  _REJECTED = 'rejected',
  _DEACTIVATED = 'deactivated'
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  status: UserStatus;
  provider: AuthProvider;
  organizationId?: string;
  phoneNumber?: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  lastLoginAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingSignUp {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phoneNumber?: string;
  requestedRole: UserRole;
  businessJustification?: string;
  referralSource?: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface MagicLinkRequest {
  id: string;
  email?: string;
  phoneNumber?: string;
  token: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface Permission {
  id: string;
  resource: string;
  action: string;
  roleId: UserRole;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}
