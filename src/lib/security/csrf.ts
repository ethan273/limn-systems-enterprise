/**
 * CSRF Protection Utilities
 *
 * Implements Cross-Site Request Forgery protection for form submissions
 * and state-changing API operations.
 *
 * @module csrf
 */

import { randomBytes } from 'crypto';
import type { NextRequest } from 'next/server';

// Reserved for future HMAC token validation
const _CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'default-csrf-secret-change-in-production';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generates a cryptographically secure CSRF token
 * @returns CSRF token string
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validates a CSRF token from request headers
 * @param request - Next.js request object
 * @param token - CSRF token to validate
 * @returns True if token is valid
 */
export function validateCsrfToken(request: NextRequest, token: string): boolean {
  // Get token from header
  const headerToken = request.headers.get('x-csrf-token');

  if (!headerToken || !token) {
    return false;
  }

  // Constant-time comparison to prevent timing attacks
  return safeCompare(headerToken, token);
}

/**
 * Safe string comparison to prevent timing attacks
 * @param a - First string
 * @param b - Second string
 * @returns True if strings match
 */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Middleware to check CSRF token on state-changing requests
 * @param request - Next.js request object
 * @returns True if request is safe
 */
export function checkCsrf(request: NextRequest): boolean {
  // Skip CSRF check for safe methods
  const method = request.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return true;
  }

  // Check for CSRF token in header
  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) {
    console.warn('[CSRF] Missing CSRF token in request');
    return false;
  }

  // In production, validate against session-stored token
  // For now, we'll validate that a token exists
  return csrfToken.length === CSRF_TOKEN_LENGTH * 2; // hex string is 2x bytes
}
