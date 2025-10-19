'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import Image from 'next/image';

type VerificationStatus = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const { resolvedTheme } = useTheme();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    // Verify the email token via API
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.error) {
          throw new Error(result.error);
        }

        setStatus('success');
        setMessage(result.message);

        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              window.location.href = '/login';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      })
      .catch((error) => {
        setStatus('error');
        setMessage(error.message || 'Verification failed. Please try again.');
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="card border shadow-lg rounded-lg px-8 py-10">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-center">
              <div className="mb-6 flex justify-center">
                {mounted ? (
                  <Image
                    src={
                      resolvedTheme === 'dark'
                        ? '/images/Limn_Logo_Dark_Mode.png'
                        : '/images/Limn_Logo_Light_Mode.png'
                    }
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
            </div>
          </div>

          {/* Verification Status */}
          <div className="space-y-6">
            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full status-icon-container-loading flex items-center justify-center">
                    <Loader2 className="w-8 h-8 status-icon-loading animate-spin" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary mb-2">
                    Verifying Your Email
                  </h1>
                  <p className="text-secondary">
                    Please wait while we verify your email address...
                  </p>
                </div>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full status-icon-container-success flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 status-icon-success" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary mb-2">
                    Email Verified!
                  </h1>
                  <p className="text-secondary mb-4">{message}</p>
                  <p className="text-sm text-tertiary">
                    Redirecting to login in {countdown} seconds...
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Go to Login Now
                  </Link>
                </div>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full status-icon-container-error flex items-center justify-center">
                    <XCircle className="w-8 h-8 status-icon-error" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary mb-2">
                    Verification Failed
                  </h1>
                  <p className="text-secondary mb-4">{message}</p>
                </div>
                <div className="space-y-3 pt-4">
                  <Link
                    href="/auth/signup"
                    className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-md btn-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Sign Up Again
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-6 py-3 border text-base font-medium rounded-md btn-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-xs text-tertiary text-center">
              Questions or issues?{' '}
              <a
                href="mailto:support@limnsystems.com"
                className="text-secondary hover:text-primary font-medium"
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="w-full max-w-md">
            <div className="card border shadow-lg rounded-lg px-8 py-10">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full status-icon-container-loading flex items-center justify-center">
                    <Loader2 className="w-8 h-8 status-icon-loading animate-spin" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-primary">Loading...</h1>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
