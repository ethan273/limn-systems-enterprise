'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Session Establishment Page
 *
 * This intermediate page ensures cookies are properly set before redirecting.
 * Solves the race condition where middleware runs before session cookies propagate.
 */
function SessionEstablisher() {
  const searchParams = useSearchParams();
  const destination = searchParams.get('destination') || '/dashboard';

  useEffect(() => {
    // CRITICAL FIX for incognito mode double-login issue:
    // Using window.location.href instead of router.push + router.refresh
    // to ensure cookies are fully persisted before next navigation
    //
    // WHY: router.refresh() can trigger server data fetch before cookies
    // are fully propagated in browsers with strict cookie policies (incognito,
    // Safari), causing middleware to not see the session and redirect to login
    //
    // SOLUTION: Full page reload with window.location ensures cookies are
    // sent with the request, middleware sees the session, auth succeeds
    const timer = setTimeout(() => {
      // Use window.location for guaranteed cookie inclusion
      window.location.href = destination;
    }, 1500); // Delay ensures cookie headers are fully written

    return () => clearTimeout(timer);
  }, [destination]);

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
