'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DevLoginPage() {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [message, setMessage] = useState('');
 const [selectedUserType, setSelectedUserType] = useState('dev');
 const router = useRouter();
 const { resolvedTheme } = useTheme();
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 }, []);

 const handleDevLogin = async (userType: string) => {
 setSelectedUserType(userType);
 setLoading(true);
 setError('');
 setMessage('');

 try {
 const response = await fetch('/api/auth/dev-login', {
 method: 'POST',
 headers: {
 'Content-Type': 'application/json',
 },
 body: JSON.stringify({ userType }),
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || 'Login failed');
 }

 setMessage(`${data.message || 'User authenticated'}! Redirecting...`);

 // Use the new callback-based flow for more reliable authentication
 if (data.redirect_url) {
 // Redirect to our callback route which will verify the token and set session
 window.location.href = data.redirect_url;
 } else if (data.magic_link) {
 // Fallback to magic link if redirect_url not provided
 window.location.href = data.magic_link;
 } else {
 // Final fallback
 setTimeout(() => {
 router.push('/dashboard');
 }, 1000);
 }

 } catch (error) {
 console.error('Dev login error:', error);
 setError(error instanceof Error ? error.message : 'Login failed');
 setLoading(false);
 }
 };

 // Only show in development
 if (process.env.NODE_ENV === 'production') {
 return (
 <div className="min-h-screen flex items-center justify-center p-4">
 <div className="text-primary text-center">
 <h1 className="text-2xl font-bold mb-4">Not Available</h1>
 <p>Development login is not available in production.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen flex items-center justify-center p-4">
 <div className="w-full max-w-md">
 <div className="card border shadow-lg rounded-lg px-8 py-10">
 <div className="mb-8">
 <Link
 href="/login"
 className="inline-flex items-center text-sm text-secondary hover:text-primary mb-6"
 >
 <ArrowLeft className="w-4 h-4 mr-2" />
 Back to login options
 </Link>

 <div className="text-center">
 <div className="mb-6 flex justify-center">
 {mounted ? (
 <Image
 src={resolvedTheme === 'dark' ? '/images/Limn_Logo_Light_Mode.png' : '/images/Limn_Logo_Dark_Mode.png'}
 alt="Limn Systems"
 width={180}
 height={50}
 priority
 key={resolvedTheme}
 unoptimized
 />
 ) : (
 <div style={{ width: 180, height: 50 }} />
 )}
 </div>
 <h1 className="text-3xl font-bold text-primary">
 Development Login
 </h1>
 <p className="text-secondary mt-2">
 Testing & Development Only
 </p>
 </div>
 </div>

 {error && (
 <div className="mb-6 p-4 alert-error border  rounded-lg">
 <p className="text-sm text-destructive">{error}</p>
 </div>
 )}

 {message && (
 <div className="mb-6 p-4 alert-success border  rounded-lg">
 <p className="text-sm text-success">{message}</p>
 </div>
 )}

 <div className="space-y-6">
 <div className="space-y-4">
 <h2 className="text-sm font-medium text-secondary">Select Test User Type:</h2>

 <Button
 onClick={() => handleDevLogin('dev')}
 disabled={loading}
 className="w-full flex items-center justify-center px-4 py-3 border rounded-lg shadow-sm btn-primary text-sm font-medium text-foreground hover:btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading && selectedUserType === 'dev' ? (
 <div className="flex items-center">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
 Authenticating...
 </div>
 ) : (
 <div className="text-left w-full">
 <div className="font-semibold">Development User</div>
 <div className="text-xs text-info">dev-user@limn.us.com - CRM & Production access</div>
 </div>
 )}
 </Button>

 <Button
 onClick={() => handleDevLogin('designer')}
 disabled={loading}
 className="w-full flex items-center justify-center px-4 py-3 border rounded-lg shadow-sm btn-secondary text-sm font-medium text-foreground hover:btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {loading && selectedUserType === 'designer' ? (
 <div className="flex items-center">
 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
 Authenticating...
 </div>
 ) : (
 <div className="text-left w-full">
 <div className="font-semibold">Designer User</div>
 <div className="text-xs text-secondary">designer-user@limn.us.com - Design module access</div>
 </div>
 )}
 </Button>
 </div>

 <div className="alert-warning border  rounded-lg p-4">
 <div className="flex">
 <div className="flex-shrink-0">
 <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
 <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
 </svg>
 </div>
 <div className="ml-3">
 <h3 className="text-sm font-medium text-warning">
 Development Only
 </h3>
 <div className="mt-2 text-sm text-warning">
 <p>
 These test users bypass normal OAuth requirements and should only be used for local development and testing.
 Each user has different permissions to test module-specific functionality.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
