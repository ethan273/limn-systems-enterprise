import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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