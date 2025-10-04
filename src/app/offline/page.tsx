"use client";

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-redirect after 2 seconds when back online
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-2xl">
        <div className="mb-6">
          <WifiOff className="h-20 w-20 text-muted-foreground mx-auto" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          You&apos;re Currently Offline
        </h1>

        <p className="text-muted-foreground mb-8">
          Some features require an internet connection. Check your network and try again.
        </p>

        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            disabled={!isOnline}
            className="btn-info w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {isOnline ? 'Retry Connection' : 'Waiting for Connection...'}
          </Button>

          {isOnline && (
            <p className="text-sm text-success">
              Connection restored! Redirecting to dashboard...
            </p>
          )}

          <div className="mt-8">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard (if cached)
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
