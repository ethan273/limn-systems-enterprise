import { z } from 'zod'

// User types enum
export const UserTypeEnum = z.enum(['client', 'contractor', 'manufacturer', 'designer'])
export type UserType = z.infer<typeof UserTypeEnum>

// Request status enum
export const RequestStatusEnum = z.enum(['pending', 'approved', 'denied'])
export type RequestStatus = z.infer<typeof RequestStatusEnum>

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  name: z.string().nullable(), // Legacy field
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  full_name: z.string().nullable(),
  company_name: z.string().nullable(),
  phone: z.string().nullable(),
  user_type: z.string().nullable(), // Can be our UserType or 'Super Admin', 'Employee'
  role: z.string().nullable(),
  avatar_url: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type UserProfile = z.infer<typeof UserProfileSchema>

// Pending user request schema
export const PendingUserRequestSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  company_name: z.string().nullable(),
  phone: z.string().nullable(),
  user_type: UserTypeEnum.nullable(),
  reason_for_access: z.string().nullable(),
  requested_at: z.date(),
  reviewed_at: z.date().nullable(),
  reviewed_by: z.string().uuid().nullable(),
  status: RequestStatusEnum,
  admin_notes: z.string().nullable(),
  metadata: z.any().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type PendingUserRequest = z.infer<typeof PendingUserRequestSchema>

// Request access input schema
export const RequestAccessInputSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  company_name: z.string().min(2, 'Company name must be at least 2 characters'),
  phone: z.string().optional(),
  user_type: UserTypeEnum,
  reason_for_access: z.string().min(10, 'Please provide at least 10 characters explaining your access needs'),
})

export type RequestAccessInput = z.infer<typeof RequestAccessInputSchema>

// Review request input schema
export const ReviewRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'deny']),
  adminNotes: z.string().optional(),
})

export type ReviewRequestInput = z.infer<typeof ReviewRequestInputSchema>
