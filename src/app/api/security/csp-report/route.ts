/**
 * CSP Violation Reporting Endpoint
 *
 * Receives and logs Content Security Policy violations from the browser.
 * This helps monitor and debug CSP issues without blocking functionality.
 *
 * Part of Phase 1: Security Hardening (Production Hardening Plan)
 *
 * @see /Users/eko3/limn-systems-enterprise-docs/00-MASTER-PLANS/PRODUCTION-HARDENING-IMPLEMENTATION-PLAN.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

/**
 * CSP Violation Report Structure
 * Based on CSP Level 2 specification
 */
interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer'?: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'status-code': number;
    'script-sample'?: string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
  };
}

/**
 * POST /api/security/csp-report
 *
 * Receives CSP violation reports from browsers.
 * This is a public endpoint that must accept reports without authentication.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the CSP violation report
    const report: CSPViolationReport = await request.json();
    const violation = report['csp-report'];

    // Log the violation with all relevant details
    log.warn('CSP Violation Detected', {
      documentUri: violation['document-uri'],
      violatedDirective: violation['violated-directive'],
      effectiveDirective: violation['effective-directive'],
      blockedUri: violation['blocked-uri'],
      sourceFile: violation['source-file'],
      lineNumber: violation['line-number'],
      columnNumber: violation['column-number'],
      scriptSample: violation['script-sample'],
      referrer: violation.referrer,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
    });

    // In production, you might want to:
    // 1. Store violations in a database for analysis
    // 2. Alert on specific violation patterns
    // 3. Aggregate violations by type/source
    // 4. Track violation trends over time

    // Return 204 No Content (standard for CSP reporting)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log parsing errors but still return 204 to prevent browser retries
    log.error('Failed to parse CSP violation report', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return new NextResponse(null, { status: 204 });
  }
}

/**
 * GET requests to this endpoint are not supported
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. This endpoint only accepts POST requests for CSP violation reports.' },
    { status: 405 }
  );
}
