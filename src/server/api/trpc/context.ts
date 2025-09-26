import { db } from '@/lib/db';
import type { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Session } from '@supabase/supabase-js';

/**
 * Create Supabase server client to get session
 */
async function getSession(): Promise<Session | null> {
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
        },
      }
    );
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session in tRPC context:', error);
    return null;
  }
}

interface CreateContextOptions {
  session?: Session | null;
  req?: CreateNextContextOptions['req'];
  res?: CreateNextContextOptions['res'];
}

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export async function createContext(opts: CreateNextContextOptions | CreateContextOptions) {
  // Get session from Supabase if not provided
  const session = 'session' in opts && opts.session !== undefined 
    ? opts.session 
    : await getSession();
  
  return {
    db, // Our hybrid database client
    session,
    req: 'req' in opts ? opts.req : undefined,
    res: 'res' in opts ? opts.res : undefined,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
