'use client';
import { log } from '@/lib/logger';

/**
 * Client Portal Login Page
 * Phase 3: Customer Self-Service Portal
 */

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/providers/ThemeProvider';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Lock, Mail } from 'lucide-react';

function PortalLoginForm() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const { resolvedTheme } = useTheme();
 const [mounted, setMounted] = useState(false);
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
  setMounted(true);

  // Check for error messages from URL query parameters
  const errorParam = searchParams.get('error');
  if (errorParam) {
   switch (errorParam) {
    case 'unauthorized_portal':
     setError('You do not have access to this portal type. Please contact support.');
     break;
    case 'no_portal_access':
     setError('Your account does not have portal access. Please contact support.');
     break;
    default:
     setError('An error occurred. Please try again.');
   }
  }
 }, [searchParams]);

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

 // Verify user has portal access (any active access record)
 const { data: portalAccessRecords } = await supabase
 .from('customer_portal_access')
 .select('*')
 .eq('user_id', data.user.id)
 .eq('is_active', true);

 if (!portalAccessRecords || portalAccessRecords.length === 0) {
 await supabase.auth.signOut();

 // Determine which portal they were trying to access from redirect parameter
 const redirect = searchParams.get('redirect');
 let portalType = 'portal';
 if (redirect) {
 const match = redirect.match(/\/portal\/(customer|designer|factory|qc)/);
 if (match) {
 portalType = `${match[1]} portal`;
 }
 }

 throw new Error(`You do not have access to the ${portalType}. Please contact support.`);
 }

 // Determine portal type and redirect to appropriate dashboard
 const redirect = searchParams.get('redirect');
 let destination = '/portal'; // Default to customer portal

 // If redirect parameter exists and is valid, use it
 if (redirect && redirect.startsWith('/portal')) {
 destination = redirect;
 } else {
 // Otherwise, redirect based on user's portal type
 const portalAccess = portalAccessRecords[0];
 const portalType = portalAccess.portal_type || 'customer';

 switch (portalType) {
 case 'designer':
 destination = '/portal/designer';
 break;
 case 'factory':
 destination = '/portal/factory';
 break;
 case 'qc':
 destination = '/portal/qc';
 break;
 case 'customer':
 default:
 destination = '/portal';
 break;
 }
 }

 router.push(destination);
 router.refresh();
 } catch (err) {
 log.error('Login error:', { err });
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
 // CORRECT: Use Light_Mode.png for light theme, Dark_Mode.png for dark theme
 // See LOGO-USAGE-PERMANENT-REFERENCE.md for full explanation
 <Image
 key={resolvedTheme}
 src={resolvedTheme === 'dark' ? '/images/Limn_Logo_Dark_Mode.png' : '/images/Limn_Logo_Light_Mode.png'}
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

export default function PortalLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <PortalLoginForm />
    </Suspense>
  );
}
