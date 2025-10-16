import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Authentication Middleware
 * Protects all routes except public paths (login, auth, public assets)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/auth/callback',
    '/auth/set-session',
    '/auth/dev',
    '/auth/contractor',
    '/auth/customer',
    '/auth/employee',
    '/portal/login',
    '/api/auth',
    '/share',
    '/privacy',
    '/terms',
  ];

  // Define public prefixes (e.g., /_next, /icons, etc.)
  const publicPrefixes = [
    '/_next',
    '/icons',
    '/images',
    '/api/auth',
    '/manifest.json',
    '/favicon',
    '/sw.js',
    '/workbox',
    '/fallback',
  ];

  // Check if path is public
  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(path));
  const isPublicPrefix = publicPrefixes.some(prefix => pathname.startsWith(prefix));

  // Allow public paths
  if (isPublicPath || isPublicPrefix) {
    return NextResponse.next();
  }

  // Create Supabase client with improved cookie handling
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Update response cookies
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // Update response cookies
          response.cookies.set({
            name,
            value: '',
            ...options,
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

  // Log auth errors for debugging
  if (authError) {
    console.error(`❌ Middleware: Auth error for ${pathname}:`, authError.message);
  }

  // If not authenticated, redirect to login
  if (!user) {
    console.log(`🔒 Middleware: Redirecting unauthenticated user from ${pathname} to /login`);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Admin access control - only admins can access /admin routes
  if (pathname.startsWith('/admin')) {
    const { data: userData } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.user_type === 'super_admin';

    if (!isAdmin) {
      console.log(`🚫 Middleware: User ${user.id} denied access to admin area (user_type: ${userData?.user_type})`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/dashboard';
      return NextResponse.redirect(redirectUrl);
    }

    console.log(`✅ Middleware: User ${user.id} has admin access (user_type: ${userData?.user_type})`);
  }

  // Portal access control - verify user has access to specific portal type
  const portalMatch = pathname.match(/^\/portal\/(customer|designer|factory|qc)(?:\/|$)/);
  if (portalMatch) {
    const requestedPortalType = portalMatch[1];

    // Query customer_portal_access to check if user has access to this portal type
    const { data: portalAccess } = await supabase
      .from('customer_portal_access')
      .select('portal_type, is_active')
      .eq('user_id', user.id)
      .eq('portal_type', requestedPortalType)
      .eq('is_active', true)
      .single();

    if (!portalAccess) {
      console.log(`🚫 Middleware: User ${user.id} denied access to ${requestedPortalType} portal`);
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/login';
      redirectUrl.searchParams.set('error', 'unauthorized_portal');
      return NextResponse.redirect(redirectUrl);
    }

    console.log(`✅ Middleware: User ${user.id} has valid ${requestedPortalType} portal access`);
  }

  console.log(`✅ Middleware: Allowing authenticated user (${user.id}) to access ${pathname}`);
  // User is authenticated, allow access
  return response;
}

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - API routes
     * - Static files (_next/static, _next/image)
     * - Public assets (images, icons, fonts)
     * - Public pages (login, auth, privacy, terms)
     */
    '/((?!api|_next/static|_next/image|icons|images|manifest|favicon|sw|workbox|fallback)(?!.*\\.(?:ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|eot)$).*)',
  ],
};
