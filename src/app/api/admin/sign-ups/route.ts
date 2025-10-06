import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all pending sign-ups
export async function GET(_request: NextRequest) {
  try {
    const signUps = await prisma.pending_user_requests.findMany({
      where: {
        status: 'pending',
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        company: true,
        message: true,
        status: true,
        created_at: true,
      },
    });

    const formattedSignUps = signUps.map((signup: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
      company: string | null;
      message: string | null;
      status: string | null;
      created_at: Date | null;
    }) => ({
      id: signup.id,
      email: signup.email,
      firstName: signup.first_name || undefined,
      lastName: signup.last_name || undefined,
      companyName: signup.company || undefined,
      businessJustification: signup.message || undefined,
      requestedAt: signup.created_at?.toISOString() || new Date().toISOString(),
      status: (signup.status || 'pending').toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED',
    }));

    return NextResponse.json({
      success: true,
      signUps: formattedSignUps,
      total: formattedSignUps.length,
    });
  } catch (error) {
    console.error('Error fetching sign-ups:', error);
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

    // Update the sign-up status
    const updatedSignUp = await prisma.pending_user_requests.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        updated_at: new Date(),
      },
    });

    // If approved, create the user account
    if (action === 'approve') {
      // Check if user already exists by email
      const existingUser = await prisma.users.findFirst({
        where: { email: updatedSignUp.email },
      });

      if (!existingUser) {
        // Generate UUID for new user
        const userId = crypto.randomUUID();

        // Create new user
        const newUser = await prisma.users.create({
          data: {
            id: userId,
            email: updatedSignUp.email,
            email_confirmed_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Create user profile with same ID
        await prisma.user_profiles.create({
          data: {
            id: newUser.id,
            email: newUser.email,
            first_name: updatedSignUp.first_name,
            last_name: updatedSignUp.last_name,
            name: `${updatedSignUp.first_name || ''} ${updatedSignUp.last_name || ''}`.trim() || null,
            user_type: 'employee',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        // Log the approval action
        await prisma.admin_audit_log.create({
          data: {
            action: 'APPROVE_SIGNUP',
            user_email: updatedSignUp.email,
            resource_type: 'sign_up',
            resource_id: id,
            metadata: { reviewerNotes },
            created_at: new Date(),
          },
        });
      }
    } else {
      // Log the rejection action
      await prisma.admin_audit_log.create({
        data: {
          action: 'REJECT_SIGNUP',
          user_email: updatedSignUp.email,
          resource_type: 'sign_up',
          resource_id: id,
          metadata: { reviewerNotes },
          created_at: new Date(),
        },
      });
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
    console.error('Error processing sign-up:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process sign-up action',
      },
      { status: 500 }
    );
  }
}
