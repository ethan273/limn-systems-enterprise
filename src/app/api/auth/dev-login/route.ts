import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Development-only authentication endpoint
// This bypasses normal OAuth flow for testing purposes
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Get user type from request body (default to 'dev')
    const body = await request.json().catch(() => ({}));
    const userType = body.userType || 'dev';

    // Define test users with different roles/permissions
    const testUsers: Record<string, { email: string; userId: string; profile: any }> = {
      dev: {
        email: 'dev-user@limn.us.com',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        profile: {
          name: 'Development User',
          first_name: 'Development',
          last_name: 'User',
          user_type: 'admin',
          department: 'development',
          job_title: 'Developer'
        }
      },
      designer: {
        email: 'designer-user@limn.us.com',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        profile: {
          name: 'Designer User',
          first_name: 'Designer',
          last_name: 'User',
          user_type: 'employee',
          department: 'design',
          job_title: 'Senior Designer'
        }
      },
      customer: {
        email: 'customer-user@limn.us.com',
        userId: '550e8400-e29b-41d4-a716-446655440002',
        profile: {
          name: 'Customer User',
          first_name: 'Customer',
          last_name: 'User',
          user_type: 'customer',
          department: null,
          job_title: null
        }
      },
      factory: {
        email: 'factory-user@limn.us.com',
        userId: '550e8400-e29b-41d4-a716-446655440003',
        profile: {
          name: 'Factory User',
          first_name: 'Factory',
          last_name: 'User',
          user_type: 'employee',
          department: 'manufacturing',
          job_title: 'Production Manager'
        }
      },
      contractor: {
        email: 'contractor-user@limn.us.com',
        userId: '550e8400-e29b-41d4-a716-446655440004',
        profile: {
          name: 'Contractor User',
          first_name: 'Contractor',
          last_name: 'User',
          user_type: 'contractor',
          department: null,
          job_title: 'Independent Contractor'
        }
      },
      user: {
        email: 'regular-user@limn.us.com',
        userId: '550e8400-e29b-41d4-a716-446655440005',
        profile: {
          name: 'Regular User',
          first_name: 'Regular',
          last_name: 'User',
          user_type: 'employee',
          department: 'operations',
          job_title: 'Staff Member'
        }
      }
    };

    // Validate userType to prevent object injection
    const allowedUserTypes = ['dev', 'designer', 'customer', 'factory', 'contractor', 'user'] as const;
    const validUserType = allowedUserTypes.includes(userType as typeof allowedUserTypes[number]) ? userType : 'dev';
    const selectedUser = testUsers[validUserType as keyof typeof testUsers];
    const testEmail = selectedUser.email;
    const testUserId = selectedUser.userId;

    // First, try to find user by email to see if one already exists
    const { data: existingUsers, error: _listUsersError } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(user => user.email === testEmail);

    let actualUserId = testUserId;

    if (!existingUser) {
      // User doesn't exist, create new one
      const { data: _newUser, error: createUserError } = await supabase.auth.admin.createUser({
        id: testUserId,
        email: testEmail,
        email_confirm: true,
        user_metadata: {
          full_name: selectedUser.profile.name,
          name: selectedUser.profile.name
        }
      });

      if (createUserError) {
        console.error('Error creating test user:', createUserError);
        return NextResponse.json({ error: 'Failed to create test user' }, { status: 500 });
      }
    } else {
      // User exists, use their actual ID
      actualUserId = existingUser.id;
    }

    // Create user profile if it doesn't exist
    const { data: _existingProfile, error: getProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', actualUserId)
      .single();

    if (getProfileError && getProfileError.code === 'PGRST116') {
      // User profile doesn't exist, create it
      const { error: createProfileError} = await supabase
        .from('user_profiles')
        .insert({
          id: actualUserId,
          email: testEmail,
          name: selectedUser.profile.name,
          first_name: selectedUser.profile.first_name,
          last_name: selectedUser.profile.last_name,
          user_type: selectedUser.profile.user_type,
          is_active: true,
          department: selectedUser.profile.department,
          job_title: selectedUser.profile.job_title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);

      if (createProfileError) {
        console.error('Error creating user profile:', createProfileError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    }

    // Create portal access for portal users (designer, customer, factory)
    if (['designer', 'customer', 'factory'].includes(userType as string)) {
      // Check if portal access already exists
      const { data: existingAccess } = await supabase
        .from('customer_portal_access')
        .select('*')
        .eq('user_id', actualUserId)
        .eq('portal_type', userType)
        .single();

      if (!existingAccess) {
        // Create portal access
        const { error: portalAccessError } = await supabase
          .from('customer_portal_access')
          .insert({
            user_id: actualUserId,
            portal_type: userType,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any);

        if (portalAccessError) {
          console.error(`Error creating ${userType} portal access:`, portalAccessError);
          // Don't fail the request, just log the error
        }
      }
    }

    // For development, create a session token directly
    // This is simpler and more reliable than magic links for testing
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback?type=dev`
      }
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
    }

    // Extract the token from the magic link
    const magicLink = sessionData.properties?.action_link;
    const tokenMatch = magicLink?.match(/token=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      console.error('No token found in magic link');
      return NextResponse.json({ error: 'Failed to extract auth token' }, { status: 500 });
    }

    return NextResponse.json({
      message: `${selectedUser.profile.name} authenticated`,
      user_id: actualUserId,
      user_type: userType,
      email: testEmail,
      token: token,
      magic_link: magicLink,
      redirect_url: `/auth/callback?token=${token}&type=${userType}`
    });

  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}