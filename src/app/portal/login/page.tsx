'use client';

/**
 * Customer Portal Login Page
 * Phase 3: Customer Self-Service Portal
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail } from 'lucide-react';

export default function PortalLoginPage() {
 const router = useRouter();
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

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
 throw new Error('You do not have access to the customer portal. Please contact support.');
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
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 {/* Logo/Brand */}
 <div className="text-center mb-8">
 <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#91bdbd] mb-4">
 <Lock className="w-8 h-8 text-foreground" />
 </div>
 <h1 className="text-3xl font-bold">Customer Portal</h1>
 <p className=" mt-2">Sign in to access your orders and documents</p>
 </div>

 {/* Login Form */}
 <div className="bg-card rounded-lg shadow-xl p-8">
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
 placeholder="customer@example.com"
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
 className="w-full bg-[#91bdbd] hover:bg-[#7da9a9] text-foreground"
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

 {/* Test Credentials (Development Only) */}
 {process.env.NODE_ENV === 'development' && (
 <div className="mt-6 p-4 btn-primary border border-primary rounded-lg">
 <p className="text-sm font-medium text-info mb-2">Test Credentials:</p>
 <p className="text-xs text-info">Email: customer@test.com</p>
 <p className="text-xs text-info">Password: (Use Supabase Auth)</p>
 </div>
 )}

 {/* Footer Links */}
 <div className="mt-6 text-center text-sm ">
 <a href="/portal/forgot-password" className="text-[#91bdbd] hover:underline">
 Forgot your password?
 </a>
 </div>
 <div className="mt-2 text-center text-sm ">
 Need help?{' '}
 <a href="mailto:support@limnsystems.com" className="text-[#91bdbd] hover:underline">
 Contact Support
 </a>
 </div>
 </div>

 {/* Footer */}
 <div className="mt-8 text-center text-sm text-tertiary">
 © {new Date().getFullYear()} Limn Systems. All rights reserved.
 </div>
 </div>
 </div>
 );
}
