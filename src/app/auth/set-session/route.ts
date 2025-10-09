import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const access_token = url.searchParams.get('access_token');
  const refresh_token = url.searchParams.get('refresh_token');

  if (!access_token || !refresh_token) {
    return NextResponse.redirect(new URL('/login?error=missing_tokens', request.url));
  }

  const response = NextResponse.redirect(new URL('/dashboard', request.url));

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Set the session
  const { error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  if (error) {
    console.error('Error setting session:', error);
    return NextResponse.redirect(new URL('/login?error=session_failed', request.url));
  }

  return response;
}
