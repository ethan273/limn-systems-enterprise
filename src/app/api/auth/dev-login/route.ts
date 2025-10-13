import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * ⚠️ DEVELOPMENT-ONLY AUTHENTICATION ENDPOINT ⚠️
 *
 * This endpoint bypasses normal OAuth flow for Playwright E2E testing.
 * Creates 6 fixed test users and generates session files.
 *
 * SECURITY NOTES:
 * - ✅ Protected by NODE_ENV check (returns 404 in production)
 * - ✅ Test users should NOT exist in production (run delete-fixed-test-users.ts)
 * - ✅ Session files are gitignored and never deployed
 *
 * See: /PRODUCTION-CHECKLIST.md - Critical Issue #1 for production security requirements
 */
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
          user_type: 'employee', // Admin role managed via permissions, not user_type enum
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

    // Helper function to find user by email with pagination
    async function findUserByEmail(email: string) {
      let page = 1;
      const perPage = 50;
      const maxPages = 20; // Search up to 1000 users max

      while (page <= maxPages) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

        if (error) {
          console.warn(`Error listing users page ${page}:`, error);
          break;
        }

        const user = data?.users?.find(u => u.email === email);
        if (user) {
          return user;
        }

        // If we got less than perPage users, we've reached the end
        if (!data?.users || data.users.length < perPage) {
          break;
        }

        page++;
      }

      return null;
    }

    // First, try to find user by email (search all pages)
    let existingUser = await findUserByEmail(testEmail);
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
        // If email_exists error, user exists but wasn't found in pagination
        // Search again more thoroughly
        if (createUserError.message.includes('already been registered') || (createUserError as any).code === 'email_exists') {
          existingUser = await findUserByEmail(testEmail);

          if (existingUser) {
            actualUserId = existingUser.id;
            console.log(`User ${testEmail} already exists with ID ${actualUserId}, using existing user`);
          } else {
            console.error('Error: User exists but cannot find by email after pagination search');
            return NextResponse.json({ error: 'Failed to locate existing test user' }, { status: 500 });
          }
        } else {
          console.error('Error creating test user:', createUserError);
          return NextResponse.json({ error: 'Failed to create test user', details: createUserError.message }, { status: 500 });
        }
      }
    } else {
      // User exists, use their actual ID
      actualUserId = existingUser.id;
      console.log(`Using existing user ${testEmail} with ID ${actualUserId}`);
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
        // Determine entity_type and entity_id based on portal type
        let entityType: string;
        let entityId: string | null = null;

        if (userType === 'customer') {
          // Create or find test customer record
          entityType = 'customer';

          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('email', testEmail)
            .single();

          if (existingCustomer) {
            entityId = (existingCustomer as any).id;
          } else {
            // Create test customer
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                name: selectedUser.profile.name,
                email: testEmail,
                phone: '+1-555-0100',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any)
              .select('id')
              .single();

            if (customerError) {
              console.error('Error creating test customer:', customerError);
            } else if (newCustomer) {
              entityId = (newCustomer as any).id;
            }
          }
        } else if (userType === 'designer' || userType === 'factory') {
          // Create or find test partner record
          entityType = 'partner';

          const { data: existingPartner } = await supabase
            .from('partners')
            .select('id')
            .eq('primary_email', testEmail)
            .single();

          if (existingPartner) {
            entityId = (existingPartner as any).id;
          } else {
            // Create test partner with all required fields
            const { data: newPartner, error: partnerError } = await supabase
              .from('partners')
              .insert({
                type: userType === 'designer' ? 'designer' : 'manufacturer',
                company_name: `${selectedUser.profile.name} Company`,
                primary_contact: selectedUser.profile.name,
                primary_email: testEmail,
                primary_phone: '+1-555-0100',
                address_line1: '123 Test Street',
                city: 'Test City',
                postal_code: '12345',
                country: 'USA',
                status: 'active',
                portal_enabled: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any)
              .select('id')
              .single();

            if (partnerError) {
              console.error('Error creating test partner:', partnerError);
            } else if (newPartner) {
              entityId = (newPartner as any).id;
            }
          }
        }

        // Create portal access with entity_type and entity_id
        // IMPORTANT: Also set customer_id for backward compatibility with portalProcedure
        const portalAccessData: any = {
          user_id: actualUserId,
          portal_type: userType,
          entity_type: entityType!,
          entity_id: entityId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // For customer portal, also set customer_id for backward compatibility
        if (userType === 'customer' && entityId) {
          portalAccessData.customer_id = entityId;
        }

        const { error: portalAccessError } = await supabase
          .from('customer_portal_access')
          .insert(portalAccessData);

        if (portalAccessError) {
          console.error(`Error creating ${userType} portal access:`, portalAccessError);
          // Don't fail the request, just log the error
        }
      }
    }

    // Update user password to enable password-based login (bypasses rate limits!)
    const testPassword = 'TestPassword123!@#Secure';

    const { error: passwordError } = await supabase.auth.admin.updateUserById(actualUserId, {
      password: testPassword
    });

    if (passwordError) {
      console.warn('Could not set password:', passwordError.message);
      // Continue anyway - user might already have password set
    }

    // Use password-based sign-in (NO rate limiting on signInWithPassword!)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError || !signInData?.session) {
      console.error('Error signing in:', signInError);
      return NextResponse.json({ error: 'Failed to sign in' }, { status: 500 });
    }

    // Return the session tokens
    return NextResponse.json({
      message: `${selectedUser.profile.name} authenticated`,
      user_id: actualUserId,
      user_type: userType,
      email: testEmail,
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at,
      redirect_url: `/auth/set-session?access_token=${signInData.session.access_token}&refresh_token=${signInData.session.refresh_token}`
    });

  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}