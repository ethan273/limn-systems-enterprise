/**
 * CSP Nonce Generation Middleware
 *
 * Generates a cryptographically secure nonce for each request
 * to enable Content Security Policy without blocking inline scripts.
 *
 * Part of Phase 1: Security Hardening (Production Hardening Plan)
 *
 * @see /Users/eko3/limn-systems-enterprise-docs/00-MASTER-PLANS/PRODUCTION-HARDENING-IMPLEMENTATION-PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Generates a random nonce for CSP headers
 * Uses Web Crypto API (Edge Runtime compatible)
 */
export function generateNonce(): string {
  // Generate 16 random bytes using Web Crypto API
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Convert to base64
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Adds CSP nonce to request headers
 *
 * The nonce is used in CSP headers and must match nonce attributes
 * in script tags to allow inline scripts execution.
 */
export function withCSPNonce(request: NextRequest): NextResponse {
  const nonce = generateNonce();

  // Clone the request headers and add nonce
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  return response;
}

/**
 * Extracts nonce from request headers (server-side)
 */
export function getNonceFromHeaders(headers: Headers): string | null {
  return headers.get('x-nonce');
}

/**
 * Builds CSP header with nonce
 *
 * Creates a Content Security Policy header that uses nonces for scripts
 * instead of 'unsafe-inline', significantly improving security.
 *
 * @param nonce - The nonce value to include in the CSP header
 * @param isDevelopment - Whether we're in development mode (affects upgrade-insecure-requests)
 * @param reportOnly - If true, uses report-only mode (logs violations without blocking)
 */
export function buildCSPHeader(
  nonce: string,
  isDevelopment: boolean = false,
  _reportOnly: boolean = true // Default to report-only for Phase 1 rollout (prefix with _ to indicate intentionally unused)
): string {
  // Get Supabase hostname from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : '';

  const cspDirectives = [
    "default-src 'self'",
    // CRITICAL: Use nonce instead of 'unsafe-inline' for scripts
    // Keep 'unsafe-eval' as it's required by tRPC
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`,
    // Styles still need 'unsafe-inline' for Tailwind's runtime generation
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `img-src 'self' data: blob: https://${supabaseHostname}`,
    "font-src 'self' https://fonts.gstatic.com",
    `connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname} https://*.ingest.us.sentry.io https://api.cloudinary.com https://res.cloudinary.com`,
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  // Add CSP violation reporting endpoint
  // This logs violations to /api/security/csp-report for monitoring
  cspDirectives.push("report-uri /api/security/csp-report");

  // Only upgrade to HTTPS in production
  if (!isDevelopment) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  return cspDirectives.join('; ');
}

/**
 * Gets the appropriate CSP header name based on report-only mode
 *
 * @param reportOnly - If true, returns header name for report-only mode
 */
export function getCSPHeaderName(reportOnly: boolean = true): string {
  return reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';
}
