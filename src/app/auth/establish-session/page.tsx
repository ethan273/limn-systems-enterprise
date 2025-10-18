'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Session Establishment Page
 *
 * This intermediate page ensures cookies are properly set before redirecting.
 * Solves the race condition where middleware runs before session cookies propagate.
 */
function SessionEstablisher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') || '/dashboard';

  useEffect(() => {
    // Small delay to ensure cookies are set
    const timer = setTimeout(() => {
      router.push(destination);
      router.refresh(); // Force a refresh to re-run middleware with new session
    }, 500);

    return () => clearTimeout(timer);
  }, [router, destination]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold text-foreground mb-2">Establishing Session...</h2>
        <p className="text-muted-foreground">You&apos;ll be redirected in a moment</p>
      </div>
    </div>
  );
}

export default function EstablishSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <SessionEstablisher />
    </Suspense>
  );
}
