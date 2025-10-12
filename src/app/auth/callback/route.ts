import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Provision user_profiles record for OAuth users
 * Ensures every authenticated user has a profile with correct permissions
 */
async function provisionUserProfile(
  userId: string,
  email: string | undefined,
  userMetadata?: { full_name?: string; avatar_url?: string; name?: string }
) {
  if (!email) {
    console.warn('[Auth Callback] No email provided for user profile provisioning');
    return;
  }

  try {
    // Check if user profile already exists
    const existingProfile = await prisma.user_profiles.findUnique({
      where: { id: userId }
    });

    if (existingProfile) {
      // Profile exists - update name and avatar from OAuth if available, preserve permissions
      const updateData: any = {};

      if (userMetadata?.full_name || userMetadata?.name) {
        const oauthName = userMetadata.full_name || userMetadata.name;
        if (oauthName !== existingProfile.name) {
          updateData.name = oauthName;
        }
      }

      if (userMetadata?.avatar_url && userMetadata.avatar_url !== existingProfile.avatar_url) {
        updateData.avatar_url = userMetadata.avatar_url;
      }

      // Update profile if we have OAuth data to sync
      if (Object.keys(updateData).length > 0) {
        const updatedProfile = await prisma.user_profiles.update({
          where: { id: userId },
          data: updateData
        });

        console.log(`[Auth Callback] ✅ Updated user profile from OAuth`);
        console.log(`[Auth Callback]    Email: ${email}`);
        console.log(`[Auth Callback]    Name: ${updatedProfile.name} ${updateData.name ? '(updated from OAuth)' : ''}`);
        console.log(`[Auth Callback]    Role: ${updatedProfile.user_type} (preserved)`);
        console.log(`[Auth Callback]    Department: ${updatedProfile.department} (preserved)`);
        return updatedProfile;
      }

      console.log(`[Auth Callback] ✅ User profile exists - no updates needed`);
      console.log(`[Auth Callback]    Email: ${email}`);
      console.log(`[Auth Callback]    Name: ${existingProfile.name}`);
      console.log(`[Auth Callback]    Role: ${existingProfile.user_type}`);
      return existingProfile;
    }

    // Determine user_type based on email domain
    let userType: 'super_admin' | 'employee' | 'customer' = 'customer';
    let department = 'General';

    if (email.endsWith('@limn.us.com')) {
      // Company emails get admin or employee status
      // For now, grant super_admin to all company emails
      // TODO: Add more granular role assignment logic
      userType = 'super_admin';
      department = 'Administration';
    }

    // Get name from OAuth provider metadata (Google, etc.) or derive from email
    const userName = userMetadata?.full_name
      || userMetadata?.name
      || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Get avatar from OAuth provider metadata
    const avatarUrl = userMetadata?.avatar_url || null;

    // Create new user profile
    const newProfile = await prisma.user_profiles.create({
      data: {
        id: userId,
        email,
        name: userName,
        user_type: userType,
        department,
        avatar_url: avatarUrl,
        created_at: new Date(),
      }
    });

    console.log(`[Auth Callback] ✅ Created user profile: ${email} as ${userType}`);
    console.log(`[Auth Callback]    Name: ${userName} (from ${userMetadata?.full_name ? 'OAuth provider' : 'email'})`);
    return newProfile;
  } catch (error) {
    console.error('[Auth Callback] Error provisioning user profile:', error);
    // Don't throw - authentication should still succeed even if profile creation fails
  }
}

export async function GET(request: NextRequest) {
  const { searchParams, origin: rawOrigin } = new URL(request.url)
  // Fix 0.0.0.0 to localhost for browser compatibility
  const origin = rawOrigin.replace('http://0.0.0.0:', 'http://localhost:')
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const userType = searchParams.get('type')

  // Handle OAuth errors first
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}&details=${encodeURIComponent(errorDescription || '')}`)
  }

  // Handle magic link token (from dev login or email magic links)
  if (token && !code) {
    const cookieStore = await cookies();

    // Track cookies to set on response
    const cookiesToSetMagic: Array<{ name: string; value: string; options: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookiesToSetMagic.push({ name, value, options });
          },
          remove(name: string, options: any) {
            cookiesToSetMagic.push({ name, value: '', options: { ...options, maxAge: 0 } });
          },
        },
      }
    );

    try {
      // Verify the token and create session
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink'
      });

      if (error) {
        console.error('Magic link verification error:', error);
        return NextResponse.redirect(`${origin}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`)
      }

      if (data.session) {
        const userEmail = data.session.user.email;
        const userId = data.session.user.id;
        const userMetadata = data.session.user.user_metadata;

        // Provision user profile (creates/updates user_profiles record)
        await provisionUserProfile(userId, userEmail, userMetadata);

        // Determine redirect URL
        let redirectUrl = `${origin}/dashboard`;

        // For dev login, always go to dashboard
        if (userType === 'dev' || userEmail === 'dev-user@limn.us.com') {
          redirectUrl = `${origin}/dashboard`;
        } else if (userEmail?.endsWith('@limn.us.com')) {
          // Route based on email domain for other magic link logins
          redirectUrl = `${origin}/dashboard`;
        } else {
          redirectUrl = `${origin}/portal`;
        }

        // Create redirect response with all cookies from Supabase
        const response = NextResponse.redirect(redirectUrl);

        // Apply all cookies that Supabase tried to set
        cookiesToSetMagic.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        return response;
      }
    } catch (error) {
      console.error('Magic link callback error:', error);
      return NextResponse.redirect(`${origin}/login?error=callback_failed`);
    }
  }

  // Handle OAuth code exchange
  if (code) {
    const cookieStore = await cookies();

    // Track cookies to set on response
    const cookiesToSet: Array<{ name: string; value: string; options: any }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookiesToSet.push({ name, value, options });
          },
          remove(name: string, options: any) {
            cookiesToSet.push({ name, value: '', options: { ...options, maxAge: 0 } });
          },
        },
      }
    );

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return NextResponse.redirect(`${origin}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`)
      }

      // OAuth code exchange successful
      if (data.session) {
        const userEmail = data.session.user.email
        const userId = data.session.user.id
        const userMetadata = data.session.user.user_metadata

        // Provision user profile (creates/updates user_profiles record)
        await provisionUserProfile(userId, userEmail, userMetadata);

        // Create response with redirect
        let redirectUrl = `${origin}/dashboard`;

        // Route based on user email domain and type
        if (userType === 'employee') {
          // Verify employee has @limn.us.com email
          if (userEmail?.endsWith('@limn.us.com')) {
            redirectUrl = `${origin}/dashboard`;
          } else {
            // Sign out non-company users trying to use employee login
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/login?error=invalid_employee_email`)
          }
        } else if (userType === 'customer') {
          // Prevent employees from using customer portal
          if (userEmail?.endsWith('@limn.us.com')) {
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/login?error=employee_use_sso`)
          } else {
            redirectUrl = `${origin}/portal`;
          }
        } else {
          // Default routing based on email domain
          if (userEmail?.endsWith('@limn.us.com')) {
            redirectUrl = `${origin}/dashboard`;
          } else {
            redirectUrl = `${origin}/portal`;
          }
        }

        // Create redirect response with all cookies from Supabase
        const response = NextResponse.redirect(redirectUrl);

        // Apply all cookies that Supabase tried to set
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });

        return response;
      }
    } catch (error) {
      return NextResponse.redirect(`${origin}/login?error=callback_failed`)
    }
  }

  // Return to login page if no code or other issues
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}