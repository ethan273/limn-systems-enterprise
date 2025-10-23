import { db } from '@/lib/db';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Session } from '@supabase/supabase-js';

/**
 * Conditional cache wrapper
 * Uses React cache() in Next.js runtime, pass-through in test/non-React environments
 */
let cacheWrapper: <T extends (...args: any[]) => any>(fn: T) => T;
if (typeof require !== 'undefined') {
  try {
    // Try to import React cache - will work in Next.js runtime
    const react = require('react');
    if (react && typeof react.cache === 'function') {
      cacheWrapper = react.cache;
    } else {
      // React exists but cache not available - use pass-through
      cacheWrapper = <T extends (...args: any[]) => any>(fn: T): T => fn;
    }
  } catch {
    // React not available - use pass-through
    cacheWrapper = <T extends (...args: any[]) => any>(fn: T): T => fn;
  }
} else {
  // No require available (ES modules only) - use pass-through
  cacheWrapper = <T extends (...args: any[]) => any>(fn: T): T => fn;
}

/**
 * Create Supabase server client to get session
 * Uses getUser() instead of getSession() for security - validates with Supabase server
 * ✅ WRAPPED WITH cache() FOR REQUEST DEDUPLICATION (Phase 3, conditional in tests)
 */
const getSession = cacheWrapper(async (): Promise<Session | null> => {
  try {
    const cookieStore = await cookies();

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
            } catch (error) {
              // Cookie setting might fail in API routes - this is okay
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // Cookie removal might fail in API routes - this is okay
            }
          },
        },
      }
    );

    // Use getUser() instead of getSession() for security
    // This validates the JWT token with Supabase servers
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Construct a minimal session object from the validated user
    // We don't use getSession() here to avoid security warnings
    // The user has already been validated with the auth server
    return {
      user,
      access_token: '', // Not needed for our use case
      refresh_token: '', // Not needed for our use case
      expires_at: 0,
      expires_in: 0,
      token_type: 'bearer',
    } as Session;
  } catch (error) {
    console.error('[tRPC Context] Error getting session:', error);
    return null;
  }
});

interface CreateContextOptions {
  session?: Session | null;
  req?: CreateNextContextOptions['req'];
  res?: CreateNextContextOptions['res'];
}

/**
 * Creates context for an incoming request
 * ✅ WRAPPED WITH cache() FOR REQUEST DEDUPLICATION (Phase 3, conditional in tests)
 * Prevents duplicate context creation and session checks within same request
 * @link https://trpc.io/docs/context
 */
export const createContext = cacheWrapper(async (opts: CreateNextContextOptions | CreateContextOptions) => {
  // Get session from Supabase if not provided
  const session = 'session' in opts && opts.session !== undefined
    ? opts.session
    : await getSession();

  return {
    db, // Our hybrid database client
    session,
    user: session?.user ?? null, // Extract user from session for convenience
    req: 'req' in opts ? opts.req : undefined,
    res: 'res' in opts ? opts.res : undefined,
  };
});

export type Context = Awaited<ReturnType<typeof createContext>>;
