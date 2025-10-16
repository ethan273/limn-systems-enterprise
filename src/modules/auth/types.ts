import { z } from 'zod'

// User types enum - synced with database user_type_enum
export const UserTypeEnum = z.enum([
  'employee',
  'contractor',
  'designer',
  'manufacturer',
  'finance',
  'super_admin',
  'customer',
  'admin'
])
export type UserType = z.infer<typeof UserTypeEnum>

// Request status enum
export const RequestStatusEnum = z.enum(['pending', 'approved', 'denied'])
export type RequestStatus = z.infer<typeof RequestStatusEnum>

// User profile schema - synced with database user_profiles table
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  name: z.string().nullable(), // Legacy field
  avatar_url: z.string().nullable(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
  title: z.string().nullable(),
  user_type: z.string().nullable(), // Can be user_type_enum or 'Super Admin', 'Employee'
  is_active: z.boolean().nullable(),
  department: z.string().nullable(),
  hire_date: z.date().nullable(),
  permissions: z.any().nullable(), // jsonb
  is_sso_user: z.boolean().nullable(),
  sso_provider: z.string().nullable(),
  google_workspace_id: z.string().nullable(),
  last_sso_login: z.date().nullable(),
  user_id: z.string().uuid().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  full_name: z.string().nullable(), // Generated column in DB
  job_title: z.string().nullable(),
  raw_metadata: z.any().nullable(), // jsonb
  // Removed fields that don't exist in DB:
  // company_name, phone, role
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// Pending user request schema - synced with database pending_user_requests table
export const PendingUserRequestSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  company: z.string().nullable(),
  message: z.string().nullable(),
  status: z.string().nullable(),
  created_at: z.date().nullable(),
  updated_at: z.date().nullable(),
})

export type PendingUserRequest = z.infer<typeof PendingUserRequestSchema>

// Request access input schema
export const RequestAccessInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  message: z.string().min(10, 'Please provide at least 10 characters explaining your access needs'),
})

export type RequestAccessInput = z.infer<typeof RequestAccessInputSchema>

// Review request input schema
export const ReviewRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
  adminNotes: z.string().optional(),
})

export type ReviewRequestInput = z.infer<typeof ReviewRequestInputSchema>
