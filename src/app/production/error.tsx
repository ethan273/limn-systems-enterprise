"use client";

/**
 * Production Module Error Boundary
 *
 * Catches and handles errors within the Production module
 * Prevents full app crash and provides user-friendly error UI
 *
 * @module production/error
 */

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProductionError({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
 // Log error to error reporting service (Sentry, etc.)
 console.error('[Production Module Error]:', error);
 }, [error]);

 return (
 <div className="min-h-screen flex items-center justify-center p-6">
 <div className="max-w-md w-full card rounded-lg border p-8 text-center">
 <div className="flex justify-center mb-6">
 <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive-muted/10">
 <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
 </div>
 </div>

 <h2 className="text-2xl font-bold text-primary mb-3">
 Something went wrong in Production
 </h2>

 <p className="text-secondary mb-6">
 An error occurred while loading the production module. This has been logged and we&apos;re working on it.
 </p>

 {process.env.NODE_ENV === 'development' && (
 <div className="mb-6 p-4 card rounded-lg text-left">
 <p className="text-xs font-mono text-destructive break-all">
 {error.message}
 </p>
 </div>
 )}

 <div className="flex gap-3 justify-center">
 <Button
 onClick={reset}
 variant="default"
 className="flex items-center gap-2"
 >
 <RefreshCcw className="w-4 h-4" aria-hidden="true" />
 Try Again
 </Button>

 <Link href="/dashboard">
 <Button variant="outline" className="flex items-center gap-2">
 <Home className="w-4 h-4" aria-hidden="true" />
 Go to Dashboard
 </Button>
 </Link>
 </div>

 {error.digest && (
 <p className="mt-6 text-xs text-tertiary">
 Error ID: {error.digest}
 </p>
 )}
 </div>
 </div>
 );
}
