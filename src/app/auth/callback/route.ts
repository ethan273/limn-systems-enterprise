import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Log login attempt to audit trail
 */
async function logLoginAttempt(params: {
  userId: string | null;
  email: string | null;
  loginType: string;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    const supabase = getSupabaseAdmin();

    await (supabase as any).from('sso_login_audit').insert({
      user_id: params.userId,
      google_email: params.email,
      login_type: params.loginType,
      success: params.success,
      error_message: params.errorMessage || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
      login_time: new Date().toISOString(),
    });

    console.log(`[Auth Callback] ✅ Logged login attempt: ${params.email} - ${params.success ? 'SUCCESS' : 'FAILED'}`);
  } catch (error) {
    // Don't fail auth if logging fails
    console.error('[Auth Callback] Failed to log login attempt:', error);
  }
}

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
    const supabase = getSupabaseAdmin();

    // Check if user profile already exists
    const { data: existingProfile, error: fetchError } = await (supabase as any)
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile && !fetchError) {
      // Profile exists - update name and avatar from OAuth if available, preserve permissions
      const updateData: Record<string, any> = {};

      if (userMetadata?.full_name || userMetadata?.name) {
        const oauthName = userMetadata.full_name || userMetadata.name;
        if (oauthName !== (existingProfile as any).name) {
          updateData.name = oauthName;
        }
      }

      if (userMetadata?.avatar_url && userMetadata.avatar_url !== (existingProfile as any).avatar_url) {
        updateData.avatar_url = userMetadata.avatar_url;
      }

      // Update profile if we have OAuth data to sync
      if (Object.keys(updateData).length > 0) {
        const { data: updatedProfile, error: updateError } = await (supabase as any)
          .from('user_profiles')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single();

        if (updateError) {
          console.error('[Auth Callback] Error updating user profile:', updateError);
          return existingProfile;
        }

        console.log(`[Auth Callback] ✅ Updated user profile from OAuth`);
        console.log(`[Auth Callback]    Email: ${email}`);
        console.log(`[Auth Callback]    Name: ${(updatedProfile as any).name} ${updateData.name ? '(updated from OAuth)' : ''}`);
        console.log(`[Auth Callback]    Role: ${(updatedProfile as any).user_type} (preserved)`);
        console.log(`[Auth Callback]    Department: ${(updatedProfile as any).department} (preserved)`);
        return updatedProfile;
      }

      console.log(`[Auth Callback] ✅ User profile exists - no updates needed`);
      console.log(`[Auth Callback]    Email: ${email}`);
      console.log(`[Auth Callback]    Name: ${(existingProfile as any).name}`);
      console.log(`[Auth Callback]    Role: ${(existingProfile as any).user_type}`);
      return existingProfile;
    }

    // Determine user_type - check pending_user_requests first for approved users
    let userType: 'super_admin' | 'employee' | 'customer' | 'contractor' | 'designer' | 'manufacturer' | 'finance' = 'customer';
    let department = 'General';
    let firstName: string | undefined;
    let lastName: string | undefined;

    // Check if this user came from the access request flow
    const { data: pendingRequest } = await (supabase as any)
      .from('pending_user_requests')
      .select('user_type, first_name, last_name, company, phone')
      .eq('email', email)
      .eq('status', 'approved')
      .maybeSingle();

    if (pendingRequest) {
      // Use user_type from the access request
      userType = (pendingRequest as any).user_type || 'customer';
      firstName = (pendingRequest as any).first_name;
      lastName = (pendingRequest as any).last_name;
      console.log(`[Auth Callback] Found approved access request - user_type: ${userType}`);
    } else if (email.endsWith('@limn.us.com') || email.endsWith('@limnsystems.com')) {
      // Company emails get employee status by default
      // Super admin, specific departments, and roles should be assigned manually:
      // 1. Via database: UPDATE user_profiles SET user_type = 'super_admin', role = 'admin' WHERE email = 'user@limn.us.com'
      // 2. Via admin panel (if available)
      // 3. Via role field in user_profiles table (checked by role-service.ts)
      userType = 'employee';
      department = 'General'; // Can be updated later via admin panel
    }

    // Get name from pending request, OAuth provider metadata (Google, etc.), or derive from email
    const userName = pendingRequest && firstName && lastName
      ? `${firstName} ${lastName}`
      : pendingRequest && firstName
      ? firstName
      : userMetadata?.full_name
      || userMetadata?.name
      || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Get avatar from OAuth provider metadata
    const avatarUrl = userMetadata?.avatar_url || null;

    // Create new user profile
    const { data: newProfile, error: createError } = await (supabase as any)
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        first_name: firstName || userName.split(' ')[0],
        last_name: lastName || (userName.split(' ').length > 1 ? userName.split(' ').slice(1).join(' ') : undefined),
        name: userName,
        user_type: userType,
        department,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('[Auth Callback] Error creating user profile:', createError);
      throw createError;
    }

    console.log(`[Auth Callback] ✅ Created user profile: ${email} as ${userType}`);
    console.log(`[Auth Callback]    Name: ${userName} (from ${userMetadata?.full_name ? 'OAuth provider' : 'email'})`);
    return newProfile;
  } catch (error) {
    console.error('[Auth Callback] Error provisioning user profile:', error);

    // DIAGNOSTIC: Show credentials info when permission errors occur
    if (error && typeof error === 'object' && 'code' in error && error.code === '42501') {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      console.error('[Auth Callback] 🚨 PERMISSION DENIED (42501) - Diagnostic Info:');
      console.error(`  Operation: Create/update user_profiles record`);
      console.error(`  Service Key Present: ${!!serviceKey}`);
      console.error(`  Service Key Prefix: ${serviceKey ? serviceKey.substring(0, 30) + '...' : 'MISSING'}`);
      console.error(`  Expected JWT pattern: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`);
      console.error(`  HINT: Decode your key at https://jwt.io to verify it has "role":"service_role"`);
      console.error(`        If it shows "role":"anon", you're using the wrong key!`);
    }

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

        // Log failed login attempt
        await logLoginAttempt({
          userId: null,
          email: null, // Can't get email from failed verification
          loginType: 'magic_link',
          success: false,
          errorMessage: error.message,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.redirect(`${origin}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`)
      }

      if (data.session) {
        const userEmail = data.session.user.email;
        const userId = data.session.user.id;
        const userMetadata = data.session.user.user_metadata;

        // Provision user profile (creates/updates user_profiles record)
        await provisionUserProfile(userId, userEmail, userMetadata);

        // Log successful login
        await logLoginAttempt({
          userId,
          email: userEmail || null,
          loginType: 'magic_link',
          success: true,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        // Determine final destination URL
        let destination = '/dashboard';

        // For dev login, always go to dashboard
        if (userType === 'dev' || userEmail === 'dev-user@limn.us.com') {
          destination = '/dashboard';
        } else if (userEmail?.endsWith('@limn.us.com')) {
          // Route based on email domain for other magic link logins
          destination = '/dashboard';
        } else {
          destination = '/portal';
        }

        // Redirect to intermediate session establishment page to avoid race condition
        // This ensures cookies are set before middleware runs on the final destination
        const redirectUrl = `${origin}/auth/establish-session?destination=${encodeURIComponent(destination)}`;

        // Create redirect response with all cookies from Supabase
        const response = NextResponse.redirect(redirectUrl);

        // Apply all cookies that Supabase tried to set
        // CRITICAL: Ensure cookies work in production (Vercel) AND incognito mode
        console.log(`[Auth Callback] Setting ${cookiesToSetMagic.length} cookies for user ${userEmail}`);
        cookiesToSetMagic.forEach(({ name, value, options }) => {
          // CRITICAL FIX: Use 'none' in production to allow cookies in incognito/private mode
          // OAuth redirect chains require sameSite='none' to persist cookies across redirects
          const sameSiteValue = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: sameSiteValue as 'none' | 'lax',
            secure: process.env.NODE_ENV === 'production',
            // IMPORTANT: Don't override httpOnly - let Supabase decide (some cookies need client-side access)
          };
          response.cookies.set(name, value, cookieOptions);
          console.log(`[Auth Callback] Cookie set: ${name}, sameSite=${cookieOptions.sameSite}, secure=${cookieOptions.secure}, httpOnly=${cookieOptions.httpOnly}`);
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
        // Log failed OAuth login attempt
        await logLoginAttempt({
          userId: null,
          email: null, // Can't get email from failed OAuth
          loginType: userType === 'employee' ? 'google_oauth_employee' : 'google_oauth_customer',
          success: false,
          errorMessage: error.message,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        return NextResponse.redirect(`${origin}/login?error=auth_failed&details=${encodeURIComponent(error.message)}`)
      }

      // OAuth code exchange successful
      if (data.session) {
        const userEmail = data.session.user.email
        const userId = data.session.user.id
        const userMetadata = data.session.user.user_metadata

        // Provision user profile (creates/updates user_profiles record)
        await provisionUserProfile(userId, userEmail, userMetadata);

        // Log successful login
        await logLoginAttempt({
          userId,
          email: userEmail || null,
          loginType: userType === 'employee' ? 'google_oauth_employee' : 'google_oauth_customer',
          success: true,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          userAgent: request.headers.get('user-agent') || undefined,
        });

        // Determine final destination
        let destination = '/dashboard';

        // Route based on user email domain and type
        if (userType === 'employee') {
          // Verify employee has @limn.us.com email
          if (userEmail?.endsWith('@limn.us.com')) {
            destination = '/dashboard';
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
            destination = '/portal';
          }
        } else {
          // Default routing based on email domain
          if (userEmail?.endsWith('@limn.us.com')) {
            destination = '/dashboard';
          } else {
            destination = '/portal';
          }
        }

        // Redirect to intermediate session establishment page to avoid race condition
        const redirectUrl = `${origin}/auth/establish-session?destination=${encodeURIComponent(destination)}`;

        // Create redirect response with all cookies from Supabase
        const response = NextResponse.redirect(redirectUrl);

        // Apply all cookies that Supabase tried to set
        // CRITICAL: Ensure cookies work in production (Vercel) AND incognito mode
        console.log(`[Auth Callback OAuth] Setting ${cookiesToSet.length} cookies for user ${userEmail}`);
        cookiesToSet.forEach(({ name, value, options }) => {
          // CRITICAL FIX: Use 'none' in production to allow cookies in incognito/private mode
          // OAuth redirect chains require sameSite='none' to persist cookies across redirects
          const sameSiteValue = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: sameSiteValue as 'none' | 'lax',
            secure: process.env.NODE_ENV === 'production',
            // IMPORTANT: Don't override httpOnly - let Supabase decide (some cookies need client-side access)
          };
          response.cookies.set(name, value, cookieOptions);
          console.log(`[Auth Callback OAuth] Cookie set: ${name}, sameSite=${cookieOptions.sameSite}, secure=${cookieOptions.secure}, httpOnly=${cookieOptions.httpOnly}`);
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