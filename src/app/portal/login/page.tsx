'use client';

/**
 * Client Portal Login Page
 * Phase 3: Customer Self-Service Portal
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail } from 'lucide-react';

export default function PortalLoginPage() {
 const router = useRouter();
 const { resolvedTheme } = useTheme();
 const [mounted, setMounted] = useState(false);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
  setMounted(true);
 }, []);

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault();
 setError('');
 setLoading(true);

 try {
 const supabase = createClient();

 // Sign in with email/password
 const { data, error: signInError } = await supabase.auth.signInWithPassword({
 email,
 password,
 });

 if (signInError) {
 throw signInError;
 }

 if (!data.user) {
 throw new Error('No user data returned');
 }

 // Verify user has portal access
 const { data: portalAccess } = await supabase
 .from('customer_portal_access')
 .select('*')
 .eq('user_id', data.user.id)
 .eq('is_active', true)
 .single();

 if (!portalAccess) {
 await supabase.auth.signOut();
 throw new Error('You do not have access to the client portal. Please contact support.');
 }

 // Redirect to portal dashboard
 router.push('/portal');
 router.refresh();
 } catch (err) {
 console.error('Login error:', err);
 setError(err instanceof Error ? err.message : 'Invalid email or password');
 setLoading(false);
 }
 };

 return (
 <div className="min-h-screen flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 {/* Logo */}
 <div className="mb-8 flex justify-center">
 {mounted ? (
 <Image
 key={resolvedTheme}
 src={resolvedTheme === 'dark' ? '/images/Limn_Logo_Light_Mode.png' : '/images/Limn_Logo_Dark_Mode.png'}
 alt="Limn Systems"
 width={180}
 height={50}
 priority
 unoptimized
 />
 ) : (
 <div style={{ width: 180, height: 50 }} />
 )}
 </div>

 {/* Portal Title */}
 <div className="text-center mb-6">
 <h1 className="text-2xl font-bold text-primary">Client Portal</h1>
 <p className="text-sm page-subtitle mt-2">Sign in to access your orders and documents</p>
 </div>

 {/* Login Form */}
 <div className="card border shadow-lg rounded-lg px-8 py-10">
 <form onSubmit={handleLogin} className="space-y-6">
 {error && (
 <Alert variant="destructive">
 <AlertDescription>{error}</AlertDescription>
 </Alert>
 )}

 <div className="space-y-2">
 <Label htmlFor="email">Email Address</Label>
 <div className="relative">
 <Mail className="absolute left-3 top-3 h-4 w-4 text-secondary" />
 <Input
 id="email"
 type="email"
 placeholder="client@example.com"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 disabled={loading}
 className="pl-10"
 />
 </div>
 </div>

 <div className="space-y-2">
 <Label htmlFor="password">Password</Label>
 <div className="relative">
 <Lock className="absolute left-3 top-3 h-4 w-4 text-secondary" />
 <Input
 id="password"
 type="password"
 placeholder="Enter your password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 disabled={loading}
 className="pl-10"
 />
 </div>
 </div>

 <Button
 type="submit"
 disabled={loading}
 className="w-full"
 >
 {loading ? (
 <>
 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
 Signing in...
 </>
 ) : (
 'Sign In'
 )}
 </Button>
 </form>

 <div className="mt-8 pt-6 border-t">
 <p className="text-xs text-tertiary text-center">
 Need help accessing your account?{' '}
 <a
 href="mailto:support@limnsystems.com"
 className="text-info hover:text-info font-medium"
 >
 Contact Support
 </a>
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
