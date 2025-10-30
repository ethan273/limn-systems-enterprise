import { log } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Logout API Endpoint
 * Ends the user's Supabase session
 */
export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Create Supabase client with cookie management
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // The set method may not be available in route handlers
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {
              // The set method may not be available in route handlers
            }
          },
        },
      }
    );

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      log.error('Logout error:', { error });
      return NextResponse.json(
        { error: 'Failed to logout', details: error.message },
        { status: 500 }
      );
    }

    // Create response and clear auth cookies manually
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear Supabase auth cookies
    response.cookies.set('sb-access-token', '', { maxAge: 0 });
    response.cookies.set('sb-refresh-token', '', { maxAge: 0 });

    return response;
  } catch (error) {
    log.error('Logout error:', { error });
    return NextResponse.json(
      { error: 'Logout failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
