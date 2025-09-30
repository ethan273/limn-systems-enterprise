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

    // Create or get test user
    const testEmail = 'dev-user@limn.us.com';
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // Same as mock user ID in TaskAttachments

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
          full_name: 'Development User',
          name: 'Development User'
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
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: actualUserId,
          email: testEmail,
          name: 'Development User',
          first_name: 'Development',
          last_name: 'User',
          user_type: 'employee',
          is_active: true,
          department: 'development',
          job_title: 'Developer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any);

      if (createProfileError) {
        console.error('Error creating user profile:', createProfileError);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }
    }

    // Generate access token for the test user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: testEmail,
      options: {
        redirectTo: `${request.nextUrl.origin}/dashboard`
      }
    });

    if (sessionError) {
      console.error('Error generating session:', sessionError);
      return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Development user authenticated',
      user_id: actualUserId,
      email: testEmail,
      magic_link: sessionData.properties?.action_link,
      redirect_url: `/dashboard`
    });

  } catch (error) {
    console.error('Dev login error:', error);
    return NextResponse.json({
      error: 'Authentication failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}