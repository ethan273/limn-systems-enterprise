"use client";
import { log } from '@/lib/logger';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { UserProfile } from '@/modules/auth/types';

interface AuthContextType {
 user: User | null;
 profile: UserProfile | null;
 loading: boolean;
 /** @deprecated Use useIsAdmin() or useIsSuperAdmin() from @/hooks/useRBAC instead */
 isAdmin: boolean;
 refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
 user: null,
 profile: null,
 loading: true,
 isAdmin: false,
 refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
 const [user, setUser] = useState<User | null>(null);
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [loading, setLoading] = useState(true);
 const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
 
 const fetchProfile = useCallback(async (userId: string) => {
 if (!supabase) return;

 try {
 const { data, error } = await supabase
 .from('user_profiles')
 .select('*')
 .eq('id', userId)
 .single();

 if (error) {
 // If profile doesn't exist, that's okay - user might not have one yet
 if (error.code === 'PGRST116') {
 log.info('No profile found for user, using default profile');
 setProfile(null);
 return;
 }
 throw error;
 }
 setProfile(data as UserProfile);
 } catch (error) {
 log.error('Error fetching profile:', {
 message: error instanceof Error ? error.message : 'Unknown error',
 code: (error as any)?.code,
 details: (error as any)?.details,
 hint: (error as any)?.hint,
 error: error
 });
 setProfile(null);
 }
 }, [supabase]);

 const refreshProfile = async () => {
 if (user?.id && supabase) {
 await fetchProfile(user.id);
 }
 };

 // Add timeout to prevent infinite loading (10 seconds - increased for slower connections)
 // NOTE: This only affects loading state, not user state
 // Middleware already validates auth on server side
 useEffect(() => {
 const timeout = setTimeout(() => {
 if (loading) {
 log.warn('Auth initialization timeout after 10s - proceeding with current auth state');
 setLoading(false);
 }
 }, 10000);

 return () => clearTimeout(timeout);
 }, [loading]);

 useEffect(() => {
 // Initialize Supabase client on mount
 try {
 const client = getSupabaseBrowserClient();
 if (client) {
 setSupabase(client);
 } else if (typeof window !== 'undefined') {
 // If we're in browser but client is null, something is wrong
 log.error('Failed to initialize Supabase client in browser');
 setLoading(false);
 }
 } catch (error) {
 log.error('Error initializing Supabase client:', { error });
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 if (!supabase) return;

 const initAuth = async () => {
 try {
 // Use getSession() with timeout wrapper - prevents hanging
 // Middleware already validated auth on server side
 const sessionPromise = supabase.auth.getSession();
 const timeoutPromise = new Promise<{ data: { session: null }, error: null }>((resolve) =>
 setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
 );

 const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
 const user = session?.user ?? null;
 setUser(user);

 if (user) {
 await fetchProfile(user.id);
 }
 } catch (error) {
 log.error('Error initializing auth:', { error });
 } finally {
 setLoading(false);
 }
 };

 initAuth();

 // Subscribe to auth state changes
 const { data: { subscription } } = supabase.auth.onAuthStateChange(
 async (_event, session) => {
 setUser(session?.user ?? null);

 if (session?.user) {
 await fetchProfile(session.user.id);
 } else {
 setProfile(null);
 }
 }
 );

 return () => subscription.unsubscribe();
 }, [supabase, fetchProfile]);

 // ✅ RBAC Migration Note: This is deprecated
 // Components should use useIsAdmin() or useIsSuperAdmin() from @/hooks/useRBAC instead
 // Keeping for backwards compatibility but will be removed in future
 const isAdmin = profile?.user_type === 'Super Admin' || profile?.user_type === 'Employee';
 
 return (
 <AuthContext.Provider value={{ user, profile, loading, isAdmin, refreshProfile }}>
 {children}
 </AuthContext.Provider>
 );
}

export function useAuthContext() {
 const context = useContext(AuthContext);
 if (!context) {
 throw new Error('useAuthContext must be used within AuthProvider');
 }
 return context;
}
