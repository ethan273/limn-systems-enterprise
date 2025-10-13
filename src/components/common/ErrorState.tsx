'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  showDetails?: boolean;
}

export function ErrorState({
  title = 'Error loading data',
  message = 'An error occurred while loading the data. Please try again.',
  error,
  onRetry,
  showDetails = process.env.NODE_ENV === 'development',
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className="min-h-[300px] flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        {showDetails && errorMessage && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-left">
            <p className="text-xs font-mono text-destructive break-all">
              {errorMessage}
            </p>
          </div>
        )}

        {onRetry && (
          <div className="flex justify-center pt-2">
            <Button
              onClick={onRetry}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorState;
