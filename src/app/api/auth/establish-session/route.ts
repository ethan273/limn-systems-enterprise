import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side endpoint to establish Supabase session from magic link tokens
 *
 * This is needed because:
 * 1. Magic link tokens come in URL fragments (client-side only)
 * 2. But middleware needs cookies to validate auth (server-side)
 * 3. @supabase/ssr browser client doesn't handle fragments well
 *
 * Flow:
 * 1. Client extracts tokens from URL fragment
 * 2. Client POSTs tokens to this endpoint
 * 3. Server creates session and sets cookies
 * 4. Middleware can now see the session
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: 'Missing tokens' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // Cookie setting can fail during SSR
              console.error('[establish-session] Cookie set error:', error);
            }
          },
          remove(name: string, options) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error('[establish-session] Cookie remove error:', error);
            }
          },
        },
      }
    );

    // Establish the session
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error('[establish-session] Session error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No session created' },
        { status: 401 }
      );
    }

    console.log('[establish-session] ✅ Session established for:', data.session.user.email);

    // Check if this is a newly approved user by looking up pending_user_requests
    const { data: pendingRequest } = await supabase
      .from('pending_user_requests')
      .select('approved_portal_type, approved_modules, linked_organization_id, organization_type, status')
      .eq('email', data.session.user.email!.toLowerCase())
      .eq('status', 'approved')
      .single();

    let userType: string | null = null;

    // If user was approved via access request system, create portal_access record
    if (pendingRequest && pendingRequest.approved_portal_type && pendingRequest.approved_modules) {
      console.log('[establish-session] Found approved access request, creating portal access...');

      // Create or update user_profile with approved user_type
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: data.session.user.id,
          email: data.session.user.email!.toLowerCase(),
          user_type: pendingRequest.approved_portal_type,
          first_name: data.session.user.user_metadata?.first_name || null,
          last_name: data.session.user.user_metadata?.last_name || null,
          phone: data.session.user.user_metadata?.phone || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('[establish-session] Error creating user profile:', profileError);
      }

      // Create portal_access record
      const { error: accessError } = await supabase
        .from('portal_access')
        .insert({
          user_id: data.session.user.id,
          portal_type: pendingRequest.approved_portal_type,
          allowed_modules: pendingRequest.approved_modules,
          customer_id: pendingRequest.organization_type === 'customer' ? pendingRequest.linked_organization_id : null,
          partner_id: pendingRequest.organization_type === 'partner' ? pendingRequest.linked_organization_id : null,
          is_active: true,
          granted_by: null, // Could be populated from pending_user_requests.reviewed_by
          granted_at: new Date().toISOString(),
        });

      if (accessError) {
        console.error('[establish-session] Error creating portal access:', accessError);
      } else {
        console.log('[establish-session] ✅ Portal access created:', {
          portal_type: pendingRequest.approved_portal_type,
          modules: pendingRequest.approved_modules
        });
      }

      userType = pendingRequest.approved_portal_type;
    } else {
      // Fetch existing user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', data.session.user.id)
        .single();

      userType = profile?.user_type || null;
    }

    console.log('[establish-session] User type:', userType);

    return NextResponse.json({
      success: true,
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        user_type: userType,
      },
    });
  } catch (error) {
    console.error('[establish-session] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
