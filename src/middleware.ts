import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Authentication Middleware
 * Protects all routes except public paths (login, auth, public assets)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 MIDDLEWARE ENTRY:', pathname);
  }

  // Validate required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ MIDDLEWARE ERROR: Missing required Supabase environment variables');
    console.error('Required environment variables:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ SET' : '❌ MISSING');
    console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ SET' : '❌ MISSING');
    console.error('');
    console.error('For GitHub Actions, configure these secrets in:');
    console.error('  Repository Settings > Secrets and variables > Actions');
    console.error('');
    console.error('For local development, ensure .env or .env.local contains:');
    console.error('  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');

    // Return 500 error with helpful message
    return new NextResponse(
      JSON.stringify({
        error: 'Configuration Error',
        message: 'Missing required Supabase environment variables. See server logs for details.',
        details: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'configured' : 'missing',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey ? 'configured' : 'missing',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Define exact public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/privacy',
    '/terms',
  ];

  // Define public path prefixes (paths that start with these)
  const publicPrefixes = [
    '/_next',
    '/icons',
    '/images',
    '/auth/',           // All auth routes (callback, dev, employee, etc.)
    '/api/auth',
    '/portal/login',
    '/share',
    '/manifest.json',
    '/favicon',
    '/sw.js',
    '/workbox',
    '/fallback',
  ];

  // Check if path is public (exact match only)
  const isPublicPath = publicPaths.includes(pathname);
  const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix));

  // Allow public paths
  if (isPublicPath || isPublicPrefix) {
    return NextResponse.next();
  }

  // Create Supabase client with improved cookie handling
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const value = request.cookies.get(name)?.value;
          // Debug logging in production to diagnose cookie issues
          if (name.includes('supabase') && process.env.NODE_ENV === 'production') {
            console.log(`[Middleware Cookie Read] ${name}: ${value ? 'EXISTS' : 'MISSING'}`);
          }
          return value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update response cookies with explicit sameSite configuration
          // CRITICAL: Use 'none' in production to support incognito mode
          const sameSiteValue = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
          response.cookies.set({
            name,
            value,
            ...options,
            sameSite: sameSiteValue as 'none' | 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
        },
        remove(name: string, options: CookieOptions) {
          // Update response cookies with explicit sameSite configuration
          const sameSiteValue = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
          response.cookies.set({
            name,
            value: '',
            ...options,
            sameSite: sameSiteValue as 'none' | 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // Enhanced logging for auth debugging
  if (authError) {
    console.error(`❌ Middleware: Auth error for ${pathname}:`, authError.message);

    // Log all cookies to debug
    const allCookies = request.cookies.getAll();
    const supabaseCookies = allCookies.filter(c => c.name.includes('supabase'));
    console.error(`   Supabase cookies present: ${supabaseCookies.length}`);
    console.error(`   Cookie names:`, supabaseCookies.map(c => c.name));
  }

  // Handle root path - redirect based on authentication status
  if (pathname === '/') {
    const redirectUrl = request.nextUrl.clone();
    if (user) {
      // Authenticated users go to dashboard
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    } else {
      // Unauthenticated users go to login
      redirectUrl.pathname = '/login';
      return NextResponse.redirect(redirectUrl);
    }
  }

  // If not authenticated, redirect to appropriate login page
  if (!user) {
    const redirectUrl = request.nextUrl.clone();

    // Portal routes redirect to portal login
    if (pathname.startsWith('/portal')) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 Middleware: Redirecting unauthenticated user from ${pathname} to /portal/login`);
      }
      redirectUrl.pathname = '/portal/login';
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // All other routes redirect to main login
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Middleware: Redirecting unauthenticated user from ${pathname} to /login`);
    }
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin access control - only admins can access /admin routes
  if (pathname.startsWith('/admin')) {
    const { data: userData, error: userError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    // Log query result for debugging
    console.log(`[ADMIN ACCESS] User: ${user.id}, userData:`, userData, 'error:', userError);

    const isAdmin = userData?.user_type === 'super_admin';

    if (!isAdmin) {
      console.log(`🚫 Middleware: User ${user.id} denied access to admin area (user_type: ${userData?.user_type})`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    console.log(`✅ Middleware: User ${user.id} has admin access (user_type: ${userData?.user_type})`);
  }

  // Portal access control - verify user has access to customer portal
  // Phase 4E: Block non-customer users from accessing /portal routes
  if (pathname.startsWith('/portal') && pathname !== '/portal/login') {
    // Query customer_portal_access to check if user has CUSTOMER portal access
    const { data: portalAccessRecords } = await supabase
      .from('customer_portal_access')
      .select('portal_type, is_active, customer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // For /portal routes (not /portal/customer, /portal/designer, etc.), require customer portal access
    const portalMatch = pathname.match(/^\/portal\/(customer|designer|factory|qc)(?:\/|$)/);

    if (portalMatch) {
      // Specific portal type requested
      const requestedPortalType = portalMatch[1];
      const hasAccess = portalAccessRecords?.some(
        record => record.portal_type === requestedPortalType && record.is_active
      );

      if (!hasAccess) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚫 Middleware: User ${user.id} denied access to ${requestedPortalType} portal`);
        }
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/portal/login';
        redirectUrl.searchParams.set('error', 'unauthorized_portal');
        return NextResponse.redirect(redirectUrl);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Middleware: User ${user.id} has valid ${requestedPortalType} portal access`);
      }
    } else {
      // Generic /portal route - require customer portal access (customer_id must be set)
      const hasCustomerPortal = portalAccessRecords?.some(
        record => record.portal_type === 'customer' && record.customer_id !== null && record.is_active
      );

      if (!hasCustomerPortal) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚫 Middleware: User ${user.id} denied access to /portal (not a customer portal user)`);
        }
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = '/portal/login';
        redirectUrl.searchParams.set('error', 'unauthorized_portal');
        return NextResponse.redirect(redirectUrl);
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Middleware: User ${user.id} has valid customer portal access`);
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Middleware: Allowing authenticated user (${user.id}) to access ${pathname}`);
  }
  // User is authenticated, allow access
  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - API routes (/_next/static, /_next/image, /api)
     * - Static files and assets
     * - Sentry tunnel route
     * - Test files and node_modules (absolute paths from E2E tests)
     * - Public pages (login, auth, privacy, terms, share)
     */
    '/((?!api|_next/static|_next/image|icons|images|manifest|favicon|sw|workbox|fallback|sentry-tunnel|monitoring|Users)(?!.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|eot|ts|js|spec|test)$).*)',
  ],
};
