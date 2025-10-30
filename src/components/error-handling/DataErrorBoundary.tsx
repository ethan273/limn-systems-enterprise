'use client';
import { log } from '@/lib/logger';

/**
 * Data Error Boundary
 * Phase 6: Error Boundaries and Loading States
 *
 * Specialized error boundary for data fetching errors with:
 * - Retry mechanism
 * - Error categorization
 * - User-friendly messages
 * - Development error details
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, WifiOff, Database, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  context?: string; // e.g., "invoices", "orders", "dashboard"
}

interface State {
  hasError: boolean;
  error?: Error;
  errorType?: 'network' | 'database' | 'auth' | 'unknown';
  retryCount: number;
}

export class DataErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Categorize error type
    let errorType: State['errorType'] = 'unknown';

    if (error.message.includes('fetch') || error.message.includes('network')) {
      errorType = 'network';
    } else if (error.message.includes('database') || error.message.includes('prisma')) {
      errorType = 'database';
    } else if (error.message.includes('unauthorized') || error.message.includes('auth')) {
      errorType = 'auth';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      log.error(
        `[DataErrorBoundary${this.props.context ? ` - ${this.props.context}` : ''}]`,
        { error, errorInfo }
      );
    }

    // In production, send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleReset = () => {
    const { retryCount } = this.state;

    if (retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        retryCount: retryCount + 1,
      });

      // Call custom reset handler if provided
      if (this.props.onReset) {
        this.props.onReset();
      }
    } else {
      // Max retries reached, reload page
      window.location.reload();
    }
  };

  getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <WifiOff className="h-12 w-12 text-destructive" />;
      case 'database':
        return <Database className="h-12 w-12 text-destructive" />;
      case 'auth':
        return <Lock className="h-12 w-12 text-destructive" />;
      default:
        return <AlertTriangle className="h-12 w-12 text-destructive" />;
    }
  };

  getErrorTitle = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'Network Connection Error';
      case 'database':
        return 'Database Error';
      case 'auth':
        return 'Authentication Error';
      default:
        return 'Something Went Wrong';
    }
  };

  getErrorMessage = () => {
    const { context } = this.props;
    const contextText = context ? ` ${context}` : ' data';

    switch (this.state.errorType) {
      case 'network':
        return `Unable to connect to the server. Please check your internet connection and try again.`;
      case 'database':
        return `There was a problem accessing${contextText}. Our team has been notified.`;
      case 'auth':
        return `Your session may have expired. Please sign in again.`;
      default:
        return `An unexpected error occurred while loading${contextText}. Please try again.`;
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { retryCount } = this.state;
      const canRetry = retryCount < this.maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                {this.getErrorIcon()}
              </div>
            </div>

            {/* Error Title & Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{this.getErrorTitle()}</h2>
              <p className="text-muted-foreground">{this.getErrorMessage()}</p>
            </div>

            {/* Retry Counter */}
            {retryCount > 0 && canRetry && (
              <p className="text-sm text-muted-foreground">
                Retry attempt {retryCount} of {this.maxRetries}
              </p>
            )}

            {/* Development Error Details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                <p className="text-xs font-semibold mb-2">Error Details (dev only):</p>
                <p className="text-xs font-mono text-destructive break-all">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs mt-2 overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center flex-wrap">
              {canRetry ? (
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              ) : (
                <Button onClick={() => window.location.reload()} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              )}

              {this.state.errorType === 'auth' ? (
                <Link href="/auth/signin">
                  <Button variant="outline" className="gap-2">
                    <Lock className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button variant="outline" className="gap-2">
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DataErrorBoundary;
