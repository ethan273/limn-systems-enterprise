import { log } from '@/lib/logger';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { hasRole, SYSTEM_ROLES } from '@/lib/services/rbac-service';

/**
 * Create Supabase server client
 */
async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
}

/**
 * Get authenticated user from Supabase
 */
export const getUser = cache(async () => {
  const supabase = await createServerSupabaseClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    log.error('Error getting user:', { error });
    return null;
  }
});

/**
 * Get user profile from database
 */
export const getUserProfile = cache(async () => {
  const user = await getUser();
  
  if (!user) return null;
  
  try {
    const profile = await prisma.user_profiles.findUnique({
      where: { id: user.id }
    });
    
    return profile;
  } catch (error) {
    log.error('Error getting user profile:', { error });
    return null;
  }
});

/**
 * Check if user is admin
 * Uses RBAC system to verify admin role
 */
export async function isAdmin() {
  const profile = await getUserProfile();

  if (!profile) return false;

  // ✅ RBAC Migration: Use role-based access control instead of user_type
  return await hasRole(profile.id, SYSTEM_ROLES.ADMIN);
}

/**
 * Require authentication - redirect to login if not authenticated
 */
export async function requireAuth() {
  const user = await getUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return user;
}

/**
 * Require admin access - redirect to home if not admin
 */
export async function requireAdmin() {
  const user = await requireAuth();
  const adminStatus = await isAdmin();
  
  if (!adminStatus) {
    redirect('/');
  }
  
  return user;
}
