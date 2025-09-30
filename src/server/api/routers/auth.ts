import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure as _protectedProcedure, adminProcedure } from '../trpc/init'
import { TRPCError } from '@trpc/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const authRouter = createTRPCRouter({
  // Public procedure to request access
  requestAccess: publicProcedure
    .input(z.object({
      email: z.string().email(),
      company_name: z.string().min(2),
      phone: z.string().optional(),
      user_type: z.enum(['customer', 'contractor', 'manufacturer', 'designer']),
      reason_for_access: z.string().min(10)
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if request already exists
        const existing = await ctx.db.pending_user_requests.findUnique({
          where: { email: input.email.toLowerCase() }
        })
        
        if (existing) {
          if (existing.status === 'pending') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A request with this email is already pending review.'
            })
          } else if (existing.status === 'approved') {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'This email has already been approved. Please check your email for the magic link.'
            })
          }
        }
        
        // Create new request
        const request = await ctx.db.pending_user_requests.create({
          data: {
            email: input.email.toLowerCase(),
            company_name: input.company_name,
            phone: input.phone || undefined,
            user_type: input.user_type,
            reason_for_access: input.reason_for_access,
            metadata: {
              ip: (ctx.req?.headers?.['x-forwarded-for'] as string) || 'unknown',
              userAgent: (ctx.req?.headers?.['user-agent'] as string) || 'unknown',
              timestamp: new Date().toISOString()
            }
          }
        })
        
        return {
          success: true,
          message: 'Your request has been submitted and will be reviewed shortly.',
          requestId: request.id
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to submit access request'
        })
      }
    }),

  // Admin procedure to get pending requests
  getPendingRequests: adminProcedure
    .input(z.object({
      status: z.enum(['pending', 'approved', 'denied', 'all']).optional().default('pending'),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0)
    }))
    .query(async ({ ctx, input }) => {
      try {
        const where = input.status === 'all' 
          ? {} 
          : { status: input.status }

        const [requests, total] = await Promise.all([
          ctx.db.pending_user_requests.findMany({
            where,
            orderBy: { requested_at: 'desc' },
            take: input.limit,
            skip: input.offset,
            include: {
              reviewer: {
                select: {
                  id: true,
                  email: true,
                  raw_user_meta_data: true
                }
              }
            }
          }),
          ctx.db.pending_user_requests.count({ where })
        ])

        return {
          requests,
          total,
          hasMore: total > input.offset + input.limit
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch pending requests'
        })
      }
    }),

  // Admin procedure to review a request (approve/deny)
  reviewRequest: adminProcedure
    .input(z.object({
      requestId: z.string().uuid(),
      action: z.enum(['approve', 'deny']),
      adminNotes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the request
        const request = await ctx.db.findUniquePendingUserRequest(input.requestId)

        if (!request) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Request not found'
          })
        }

        if (request.status !== 'pending') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Request has already been ${request.status}`
          })
        }

        // Update the request status
        const updatedRequest = await ctx.db.pending_user_requests.update({
          where: { id: input.requestId },
          data: {
            status: input.action === 'approve' ? 'approved' : 'denied',
            reviewed_at: new Date(),
            reviewed_by: ctx.session?.user?.id,
            admin_notes: input.adminNotes,
            updated_at: new Date()
          }
        })

        // If approved, send magic link
        if (input.action === 'approve') {
          const { error: magicLinkError } = await supabaseAdmin.auth.signInWithOtp({
            email: request.email,
            options: {
              emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
              data: {
                company_name: request.company_name,
                user_type: request.user_type,
                phone: request.phone,
                approved_at: new Date().toISOString()
              }
            }
          })

          if (magicLinkError) {
            // Rollback the approval
            await ctx.db.pending_user_requests.update({
              where: { id: input.requestId },
              data: {
                status: 'pending',
                reviewed_at: null,
                reviewed_by: null,
                admin_notes: null
              }
            })

            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to send magic link: ${magicLinkError.message}`
            })
          }
        }

        return {
          success: true,
          message: `Request ${input.action === 'approve' ? 'approved and magic link sent' : 'denied'}`,
          request: updatedRequest
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to review request'
        })
      }
    }),

  // Admin procedure to get request statistics
  getRequestStats: adminProcedure
    .query(async ({ ctx }) => {
      try {
        const [pending, approved, denied, total] = await Promise.all([
          ctx.db.pending_user_requests.count({ where: { status: 'pending' } }),
          ctx.db.pending_user_requests.count({ where: { status: 'approved' } }),
          ctx.db.pending_user_requests.count({ where: { status: 'denied' } }),
          ctx.db.pending_user_requests.count()
        ])

        // Get recent activity (last 7 days)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const recentRequests = await ctx.db.pending_user_requests.findMany({
          where: {
            requested_at: {
              gte: sevenDaysAgo
            }
          },
          orderBy: { requested_at: 'desc' },
          take: 10
        })

        return {
          stats: {
            pending,
            approved, 
            denied,
            total,
            approvalRate: total > 0 ? ((approved / total) * 100).toFixed(1) : 0
          },
          recentRequests
        }
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch request statistics'
        })
      }
    }),

  // Public procedure to send magic link (for already approved users)
  sendMagicLink: publicProcedure
    .input(z.object({
      email: z.string().email()
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user is approved
        const request = await ctx.db.pending_user_requests.findUnique({
          where: { email: input.email.toLowerCase() }
        })

        if (!request || request.status !== 'approved') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This email has not been approved for access. Please request access first.'
          })
        }

        // Send magic link
        const { error } = await supabaseAdmin.auth.signInWithOtp({
          email: input.email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
          }
        })

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send magic link. Please try again.'
          })
        }

        return {
          success: true,
          message: 'Magic link sent! Please check your email.'
        }
      } catch (error) {
        if (error instanceof TRPCError) throw error
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send magic link'
        })
      }
    })
})