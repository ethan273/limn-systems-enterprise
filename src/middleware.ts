import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client for rate limiting
function createRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  return new Redis({ url, token });
}

const redis = createRedis();

// Create rate limiters for different endpoint types
const webhookLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:webhook',
    })
  : null;

const publicApiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      analytics: true,
      prefix: 'ratelimit:public-api',
    })
  : null;

/**
 * Authentication Middleware
 * Protects all routes except public paths (login, auth, public assets)
 * Also adds rate limiting for webhooks and public endpoints
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // =====================================================
  // RATE LIMITING FOR WEBHOOKS
  // =====================================================
  if (pathname.startsWith('/api/webhooks/')) {
    if (webhookLimiter) {
      const identifier =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'anonymous';
      const result = await webhookLimiter.limit(identifier);

      if (!result.success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        });
      }
    }
  }

  // =====================================================
  // RATE LIMITING FOR UNSUBSCRIBE PAGE
  // =====================================================
  if (pathname.startsWith('/unsubscribe/')) {
    if (publicApiLimiter) {
      const identifier =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        'anonymous';
      const result = await publicApiLimiter.limit(identifier);

      if (!result.success) {
        return new NextResponse('Too Many Requests - Please try again later', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.reset.toString(),
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
          },
        });
      }
    }
  }

  // =====================================================
  // CRON JOB AUTHENTICATION
  // =====================================================
  if (pathname.startsWith('/api/cron/')) {
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[middleware] CRON_SECRET not configured');
      return new NextResponse('Service configuration error', { status: 500 });
    }

    if (authHeader !== `Bearer ${expectedSecret}`) {
      console.error('[middleware] Unauthorized cron request:', pathname);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Allow cron jobs to proceed without further checks
    return NextResponse.next();
  }

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
    '/auth/',           // All auth routes (callback, dev, employee, establish-session, etc.)
    '/api/auth',
    '/api/webhooks',    // Webhook endpoints (rate-limited separately)
    '/api/cron',        // Cron job endpoints (authenticated separately)
    '/portal/login',
    '/s/',              // Share links (e.g., /s/token or /s/vanity-slug)
    '/share',
    '/unsubscribe/',    // Email unsubscribe page (public, rate-limited)
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
          // Only handle Supabase auth cookies - skip third-party cookies like Cloudflare's __cf_bm
          // This prevents "invalid domain" errors from cookies we don't control
          if (!name.startsWith('sb-')) {
            return;
          }

          // Update response cookies with explicit sameSite configuration
          // CRITICAL: Use 'none' in production to support incognito mode
          const sameSiteValue = process.env.NODE_ENV === 'production' ? 'none' : 'lax';

          // Filter out domain attribute to avoid "invalid domain" errors
          // Let the browser use the current domain automatically
          const { domain: _domain, ...safeOptions } = options || {};

          response.cookies.set({
            name,
            value,
            ...safeOptions,
            sameSite: sameSiteValue as 'none' | 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
        },
        remove(name: string, options: CookieOptions) {
          // Update response cookies with explicit sameSite configuration
          const sameSiteValue = process.env.NODE_ENV === 'production' ? 'none' : 'lax';

          // Filter out domain attribute to avoid "invalid domain" errors
          // Let the browser use the current domain automatically
          const { domain: _domain, ...safeOptions } = options || {};

          response.cookies.set({
            name,
            value: '',
            ...safeOptions,
            sameSite: sameSiteValue as 'none' | 'lax',
            secure: process.env.NODE_ENV === 'production',
          });
        },
      },
    }
  );

  // Check if user is authenticated
  // CRITICAL FIX: Use getSession() instead of getUser() to prevent double-login
  // getUser() hits Supabase API which can fail if cookies aren't fully propagated
  // getSession() reads directly from cookies, much faster and more reliable
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  const user = session?.user;

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
    // ✅ RBAC Migration: Check user roles via user_roles table
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    // Log query result for debugging
    console.log(`[ADMIN ACCESS] User: ${user.id}, roles:`, userRoles, 'error:', rolesError);

    let hasAdminRole = userRoles?.some(ur =>
      ur.role === 'admin' || ur.role === 'super_admin' || ur.role === 'employee'
    ) ?? false;

    // ⚠️ FALLBACK: If no roles found, check user_type field for backward compatibility
    if (!hasAdminRole && (!userRoles || userRoles.length === 0)) {
      console.log(`[ADMIN ACCESS FALLBACK] No roles found, checking user_type for user ${user.id}...`);

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('user_type, email')
        .eq('id', user.id)
        .single();

      if (userProfile?.user_type) {
        console.log(`[ADMIN ACCESS FALLBACK] User ${userProfile.email} has user_type: ${userProfile.user_type}`);

        // Allow access if user_type is admin or super_admin
        hasAdminRole = userProfile.user_type === 'super_admin' ||
                       userProfile.user_type === 'admin' ||
                       userProfile.user_type === 'employee';

        if (hasAdminRole) {
          console.log(`✅ [ADMIN ACCESS FALLBACK] Granted access based on user_type: ${userProfile.user_type}`);
        }
      }
    }

    if (!hasAdminRole) {
      console.log(`🚫 Middleware: User ${user.id} denied access to admin area (has admin role: false)`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    console.log(`✅ Middleware: User ${user.id} has admin access (roles:`, userRoles?.map(r => r.role).join(', '), ')');
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
