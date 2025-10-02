'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DevLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setMessage('Development user authenticated! Redirecting...');

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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Not Available</h1>
          <p>Development login is not available in production.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 border border-gray-700 shadow-lg rounded-lg px-8 py-10">
          <div className="mb-8">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-gray-400 hover:text-gray-200 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login options
            </Link>

            <div className="text-center">
              <div className="mb-6 flex justify-center">
                <div className="text-3xl font-bold text-white">LIMN</div>
              </div>
              <h1 className="text-3xl font-bold text-white">
                Development Login
              </h1>
              <p className="text-gray-400 mt-2">
                Testing & Development Only
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-600 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-600 rounded-lg">
              <p className="text-sm text-green-400">{message}</p>
            </div>
          )}

          <div className="space-y-6">
            <Button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-600 rounded-lg shadow-sm bg-orange-600 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </div>
              ) : (
                'Login as Development User'
              )}
            </Button>

            <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-300">
                    Development Only
                  </h3>
                  <div className="mt-2 text-sm text-orange-400">
                    <p>
                      This login creates a test user (dev-user@limn.us.com) for development and testing purposes.
                      It bypasses normal OAuth requirements and should only be used locally.
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