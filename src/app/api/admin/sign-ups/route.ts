import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { sendAccessApprovedEmail } from '@/lib/email/templates/access-approved';
import { sendAccessDeniedEmail } from '@/lib/email/templates/access-denied';
import { notifyAccessApproved, notifyAccessDenied } from '@/lib/google-chat';
import { getUser } from '@/lib/auth/server';
import { hasRole, SYSTEM_ROLES } from '@/lib/services/rbac-service';

const prisma = new PrismaClient();

// Lazy-initialized Supabase client with service role for admin operations
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required'
      );
    }

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  }

  return supabaseAdmin;
}

// GET - Fetch all pending sign-ups
export async function GET(_request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ✅ RBAC Migration: Check if user has admin role
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!userProfile || !await hasRole(userProfile.id, SYSTEM_ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const signUps = await prisma.pending_user_requests.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        requested_at: 'desc',
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        company: true,
        phone: true,
        user_type: true,
        reason_for_access: true,
        message: true,
        status: true,
        requested_at: true,
        created_at: true,
      },
    });

    const formattedSignUps = signUps.map((signup: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
      phone: string | null;
      user_type: string | null;
      reason_for_access: string | null;
      message: string | null;
      status: string | null;
      requested_at: Date | null;
      created_at: Date | null;
    }) => ({
      id: signup.id,
      email: signup.email,
      firstName: signup.first_name || undefined,
      lastName: signup.last_name || undefined,
      companyName: signup.company || undefined,
      phone: signup.phone || undefined,
      userType: signup.user_type || undefined,
      reasonForAccess: signup.reason_for_access || undefined,
      businessJustification: signup.message || undefined,
      requestedAt: signup.requested_at?.toISOString() || signup.created_at?.toISOString() || new Date().toISOString(),
      status: (signup.status || 'pending').toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED',
    }));

    return NextResponse.json({
      success: true,
      signUps: formattedSignUps,
      total: formattedSignUps.length,
    });
  } catch (error) {
    log.error('Error fetching sign-ups:', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sign-ups',
        signUps: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}

// POST - Approve or reject a sign-up
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // ✅ RBAC Migration: Check if user has admin role
    const userProfile = await prisma.user_profiles.findUnique({
      where: { id: user.id },
      select: { id: true },
    });

    if (!userProfile || !await hasRole(userProfile.id, SYSTEM_ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, action, reviewerNotes } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: id and action' },
        { status: 400 }
      );
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Get reviewer info (already validated above)
    const reviewerEmail = user.email || 'system';
    const reviewerId = user.id;

    // Fetch the request first
    const signUpRequest = await prisma.pending_user_requests.findUnique({
      where: { id },
    });

    if (!signUpRequest) {
      return NextResponse.json(
        { success: false, error: 'Sign-up request not found' },
        { status: 404 }
      );
    }

    // Update the sign-up status
    const updatedSignUp = await prisma.pending_user_requests.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'denied',
        reviewed_at: new Date(),
        reviewed_by: reviewerId,
        admin_notes: reviewerNotes || undefined,
        updated_at: new Date(),
      },
    });

    const userName = updatedSignUp.last_name
      ? `${updatedSignUp.first_name} ${updatedSignUp.last_name}`
      : updatedSignUp.first_name || 'User';

    // If approved, send magic link and notifications
    if (action === 'approve') {
      try {
        // Send magic link via Supabase
        const { data: magicLinkData, error: magicLinkError } = await getSupabaseAdmin().auth.signInWithOtp({
          email: updatedSignUp.email,
          options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        });

        if (magicLinkError) {
          log.error('[POST /api/admin/sign-ups] Failed to generate magic link:', magicLinkError);
          // Don't fail the approval, but log the error
        }

        // Send approval email (non-blocking)
        sendAccessApprovedEmail({
          to: updatedSignUp.email,
          firstName: updatedSignUp.first_name || 'User',
          magicLink: (magicLinkData as any)?.properties?.action_link || '#',
          userType: updatedSignUp.user_type || 'customer',
        }).catch(err => {
          log.error('[POST /api/admin/sign-ups] Failed to send approval email:', { error: err });
        });

        // Send Google Chat notification (non-blocking)
        notifyAccessApproved({
          email: updatedSignUp.email,
          name: userName,
          approvedBy: reviewerEmail,
        }).catch(err => {
          log.error('[POST /api/admin/sign-ups] Failed to send Google Chat notification:', { error: err });
        });
      } catch (error) {
        log.error('[POST /api/admin/sign-ups] Error in approval notifications:', { error });
      }

      // Check if user already exists by email (check user_profiles instead of auth.users)
      const existingUserArray = await prisma.user_profiles.findMany({
        where: { email: updatedSignUp.email },
        take: 1,
      });
      const existingUser = existingUserArray.length > 0 ? existingUserArray[0] : null;

      if (!existingUser) {
        // Generate UUID for new user
        const userId = crypto.randomUUID();

        // Create new user in auth.users
        await prisma.users.create({
          data: {
            id: userId,
            email: updatedSignUp.email,
            email_confirmed_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create user profile with user_type from request
        await prisma.user_profiles.create({
          data: {
            id: userId,
            email: updatedSignUp.email,
            first_name: updatedSignUp.first_name,
            last_name: updatedSignUp.last_name,
            name: userName,
            user_type: (updatedSignUp.user_type as any) || 'customer',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      // Log the approval action (non-blocking, may fail due to RLS)
      try {
        await prisma.admin_audit_log.create({
          data: {
            action: 'APPROVE_SIGNUP',
            user_email: updatedSignUp.email,
            resource_type: 'sign_up',
            resource_id: id,
            metadata: { reviewerNotes, reviewerEmail },
            created_at: new Date(),
          },
        });
      } catch (auditError) {
        log.error('[POST /api/admin/sign-ups] Failed to create audit log:', { error: auditError });
        // Don't fail the request if audit logging fails
      }
    } else {
      // Send denial email (non-blocking)
      sendAccessDeniedEmail({
        to: updatedSignUp.email,
        firstName: updatedSignUp.first_name || 'User',
        reason: reviewerNotes,
      }).catch(err => {
        log.error('[POST /api/admin/sign-ups] Failed to send denial email:', { error: err });
      });

      // Send Google Chat notification (non-blocking)
      notifyAccessDenied({
        email: updatedSignUp.email,
        name: userName,
        deniedBy: reviewerEmail,
        reason: reviewerNotes,
      }).catch(err => {
        log.error('[POST /api/admin/sign-ups] Failed to send Google Chat notification:', { error: err });
      });

      // Log the rejection action (non-blocking, may fail due to RLS)
      try {
        await prisma.admin_audit_log.create({
          data: {
            action: 'REJECT_SIGNUP',
            user_email: updatedSignUp.email,
            resource_type: 'sign_up',
            resource_id: id,
            metadata: { reviewerNotes, reviewerEmail },
            created_at: new Date(),
          },
        });
      } catch (auditError) {
        log.error('[POST /api/admin/sign-ups] Failed to create audit log:', { error: auditError });
        // Don't fail the request if audit logging fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sign-up ${action}d successfully`,
      signUp: {
        id: updatedSignUp.id,
        email: updatedSignUp.email,
        status: updatedSignUp.status,
      },
    });
  } catch (error) {
    log.error('Error processing sign-up:', { error });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process sign-up action',
      },
      { status: 500 }
    );
  }
}
