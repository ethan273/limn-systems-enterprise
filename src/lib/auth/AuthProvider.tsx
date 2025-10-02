"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
import { UserProfile } from '@/modules/auth/types';

interface AuthContextType {
 user: User | null;
 profile: UserProfile | null;
 loading: boolean;
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
 console.log('No profile found for user, using default profile');
 setProfile(null);
 return;
 }
 throw error;
 }
 setProfile(data as UserProfile);
 } catch (error) {
 console.error('Error fetching profile:', {
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

 // Add timeout to prevent infinite loading (5 seconds)
 useEffect(() => {
 const timeout = setTimeout(() => {
 if (loading) {
 console.warn('Auth initialization timeout after 5s - proceeding without authentication');
 setLoading(false);
 }
 }, 5000);

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
 console.error('Failed to initialize Supabase client in browser');
 setLoading(false);
 }
 } catch (error) {
 console.error('Error initializing Supabase client:', error);
 setLoading(false);
 }
 }, []);

 useEffect(() => {
 if (!supabase) return;

 const initAuth = async () => {
 try {
 const { data: { user } } = await supabase.auth.getUser();
 setUser(user);

 if (user) {
 await fetchProfile(user.id);
 }
 } catch (error) {
 console.error('Error initializing auth:', error);
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
