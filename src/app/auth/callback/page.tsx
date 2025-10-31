'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

/**
 * Client-side callback handler for Supabase Auth
 *
 * Handles magic link authentication where Supabase returns auth tokens
 * in the URL fragment (#access_token=...) which is only accessible client-side.
 *
 * Flow:
 * 1. User clicks magic link
 * 2. Supabase redirects to /auth/callback#access_token=...
 * 3. This page extracts tokens from fragment
 * 4. Calls Supabase to exchange tokens for session
 * 5. Redirects to dashboard or shows error
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Create Supabase client (using regular client, not SSR client, for fragment-based auth)
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              flowType: 'implicit', // Support URL fragment tokens
              detectSessionInUrl: true, // Automatically detect and process session from URL
              persistSession: true,
              autoRefreshToken: true,
            }
          }
        );

        // Check if there's a hash fragment with auth data
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('[Auth Callback Client] Hash params:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          type,
        });

        // If we have tokens in the fragment, send them to server to establish session
        if (accessToken && refreshToken && type === 'magiclink') {
          console.log('[Auth Callback Client] Magic link detected, establishing session...');

          try {
            // POST tokens to server endpoint to establish session with cookies
            const response = await fetch('/api/auth/establish-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: accessToken,
                refresh_token: refreshToken,
              }),
              credentials: 'same-origin', // Include cookies in request
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
              console.error('[Auth Callback Client] Failed to establish session:', data.error);
              setStatus('error');
              setErrorMessage(data.error || 'Failed to establish session');
              setTimeout(() => {
                router.push('/login?error=session_failed');
              }, 2000);
              return;
            }

            console.log('[Auth Callback Client] ✅ Session established successfully');
            console.log('[Auth Callback Client] User:', data.user.email);
            console.log('[Auth Callback Client] User type:', data.user.user_type);
            setStatus('success');

            // Query portal_access to determine redirect (source of truth for portal access)
            let redirectUrl = '/dashboard'; // Default for employees/admins

            try {
              // Check if user has portal access
              const { data: portalAccessRecords, error: portalError } = await supabase
                .from('portal_access')
                .select('portal_type, is_active')
                .eq('user_id', data.user.id)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

              if (portalError) {
                console.error('[Auth Callback Client] Error querying portal access:', portalError);
              }

              // If user has portal access, redirect to their primary portal
              if (portalAccessRecords && portalAccessRecords.length > 0) {
                const primaryPortal = portalAccessRecords[0];
                console.log('[Auth Callback Client] Portal access found:', primaryPortal.portal_type);
                redirectUrl = `/portal/${primaryPortal.portal_type}`;
              } else {
                // No portal access - fallback to user_type
                console.log('[Auth Callback Client] No portal access found, using user_type');
                switch (data.user.user_type) {
                  case 'customer':
                    redirectUrl = '/portal/customer';
                    break;
                  case 'designer':
                    redirectUrl = '/portal/designer';
                    break;
                  case 'manufacturer':
                  case 'contractor':
                    redirectUrl = '/portal/factory';
                    break;
                  default:
                    // Employee, admin, or null -> main dashboard
                    redirectUrl = '/dashboard';
                }
              }
            } catch (error) {
              console.error('[Auth Callback Client] Exception querying portal access:', error);
              // Fallback to user_type on error
              switch (data.user.user_type) {
                case 'customer':
                  redirectUrl = '/portal/customer';
                  break;
                case 'designer':
                  redirectUrl = '/portal/designer';
                  break;
                case 'manufacturer':
                case 'contractor':
                  redirectUrl = '/portal/factory';
                  break;
                default:
                  redirectUrl = '/dashboard';
              }
            }

            // Redirect to appropriate portal after short delay
            setTimeout(() => {
              console.log('[Auth Callback Client] Redirecting to:', redirectUrl);
              router.push(redirectUrl);
            }, 1000);
            return;
          } catch (error: any) {
            console.error('[Auth Callback Client] Exception during session establishment:', error);
            setStatus('error');
            setErrorMessage(error.message || 'Session establishment failed');
            setTimeout(() => {
              router.push('/login?error=session_failed');
            }, 2000);
            return;
          }
        }

        // Check for query parameter code (OAuth flow)
        const searchParams = new URLSearchParams(window.location.search);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          console.error('[Auth Callback Client] OAuth error:', error);
          setStatus('error');
          setErrorMessage(error);
          setTimeout(() => {
            router.push('/login?error=' + error);
          }, 2000);
          return;
        }

        if (code) {
          console.log('[Auth Callback Client] OAuth code found, exchanging for session');

          // Exchange the OAuth code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('[Auth Callback Client] Error exchanging code:', exchangeError);
            setStatus('error');
            setErrorMessage(exchangeError.message);
            setTimeout(() => {
              router.push('/login?error=auth_failed');
            }, 2000);
            return;
          }

          if (data.session) {
            console.log('[Auth Callback Client] ✅ OAuth session established successfully');
            console.log('[Auth Callback Client] User ID:', data.session.user.id);
            console.log('[Auth Callback Client] Session:', data.session);
            setStatus('success');

            // Use session data directly instead of calling getUser() again
            const userId = data.session.user.id;
            console.log('[Auth Callback Client] 🔍 Starting portal access query for userId:', userId);

            // Query portal_access to determine redirect (source of truth for portal access)
            let redirectUrl = '/dashboard'; // Default for employees/admins

            try {
              console.log('[Auth Callback Client] 📊 Querying portal_access table...');
              // Check if user has portal access
              const { data: portalAccessRecords, error: portalError } = await supabase
                .from('portal_access')
                .select('portal_type, is_active')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false });

              console.log('[Auth Callback Client] Portal access query result:', {
                records: portalAccessRecords,
                error: portalError,
                count: portalAccessRecords?.length || 0,
              });

              if (portalError) {
                console.error('[Auth Callback Client] ❌ Error querying portal access:', portalError);
              }

              // If user has portal access, redirect to their primary portal
              if (portalAccessRecords && portalAccessRecords.length > 0) {
                const primaryPortal = portalAccessRecords[0];
                console.log('[Auth Callback Client] ✅ Portal access found:', primaryPortal.portal_type);
                redirectUrl = `/portal/${primaryPortal.portal_type}`;
                console.log('[Auth Callback Client] 🎯 Redirect URL set to:', redirectUrl);
              } else {
                // No portal access - fallback to user_type
                console.log('[Auth Callback Client] ⚠️ No portal access found, querying user_type...');

                // Fetch user_type from user_profiles
                const { data: profile, error: profileError } = await supabase
                  .from('user_profiles')
                  .select('user_type')
                  .eq('id', userId)
                  .single();

                console.log('[Auth Callback Client] User profile query result:', {
                  profile,
                  error: profileError,
                });

                if (profileError) {
                  console.error('[Auth Callback Client] ❌ Error fetching profile:', profileError);
                }

                const userType = profile?.user_type;
                console.log('[Auth Callback Client] User type:', userType);

                switch (userType) {
                  case 'customer':
                    redirectUrl = '/portal/customer';
                    console.log('[Auth Callback Client] 🎯 Customer redirect:', redirectUrl);
                    break;
                  case 'designer':
                    redirectUrl = '/portal/designer';
                    console.log('[Auth Callback Client] 🎯 Designer redirect:', redirectUrl);
                    break;
                  case 'manufacturer':
                  case 'contractor':
                    redirectUrl = '/portal/factory';
                    console.log('[Auth Callback Client] 🎯 Factory redirect:', redirectUrl);
                    break;
                  default:
                    redirectUrl = '/dashboard';
                    console.log('[Auth Callback Client] 🎯 Default redirect:', redirectUrl);
                }
              }
            } catch (error) {
              console.error('[Auth Callback Client] ❌ Exception querying portal access:', error);
              // Fallback to dashboard on error
              redirectUrl = '/dashboard';
              console.log('[Auth Callback Client] 🎯 Error fallback redirect:', redirectUrl);
            }

            console.log('[Auth Callback Client] 🚀 Setting up redirect timeout to:', redirectUrl);
            // Redirect to appropriate portal after short delay
            setTimeout(() => {
              console.log('[Auth Callback Client] ⏰ Timeout fired - Executing redirect to:', redirectUrl);
              router.push(redirectUrl);
              console.log('[Auth Callback Client] ✅ Router.push() called');
            }, 1000);
            console.log('[Auth Callback Client] ⏳ Waiting 1 second before redirect...');
            return;
          }
        }

        // No auth data found
        console.log('[Auth Callback Client] No auth data found in URL');
        setStatus('error');
        setErrorMessage('No authentication data found');
        setTimeout(() => {
          router.push('/login?error=no_code');
        }, 2000);
      } catch (error) {
        console.error('[Auth Callback Client] Unexpected error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred');
        setTimeout(() => {
          router.push('/login?error=callback_failed');
        }, 2000);
      }
    };

    handleCallback();

    // Cleanup function
    return () => {
      // Component unmounted
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            {status === 'loading' && 'Completing sign in...'}
            {status === 'success' && 'Sign in successful!'}
            {status === 'error' && 'Sign in failed'}
          </h2>

          {status === 'loading' && (
            <div className="mt-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent opacity-75"></div>
              <p className="mt-4 text-sm">
                Please wait while we complete your authentication...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="mt-4 text-sm">
                Redirecting to dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <p className="mt-4 text-sm font-semibold">
                {errorMessage || 'Authentication failed'}
              </p>
              <p className="mt-2 text-xs">
                Redirecting to login page...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
