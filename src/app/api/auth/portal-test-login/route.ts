import { log } from '@/lib/logger';
/**
 * Portal Test Login API
 * For Playwright tests only - creates Supabase session for portal users
 * Similar to dev-login but for portal test users
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  // Only allow in development/test (block in production)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 }
    );
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Find user by email
    const { data: existingUsers, error: _listUsersError } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(user => user.email === email);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate magic link for this user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${request.nextUrl.origin}/auth/callback?type=portal`
      }
    });

    if (sessionError) {
      log.error('Error generating session:', { sessionError });
      return NextResponse.json({ error: 'Failed to generate session' }, { status: 500 });
    }

    // Extract the token from the magic link
    const magicLink = sessionData.properties?.action_link;
    const tokenMatch = magicLink?.match(/token=([^&]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      log.error('No token found in magic link');
      return NextResponse.json({ error: 'Failed to extract auth token' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user_id: existingUser.id,
      email: email,
      token: token,
      redirect_url: `/auth/callback?token=${token}&type=portal`
    });

  } catch (error) {
    log.error('Portal test login error:', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
