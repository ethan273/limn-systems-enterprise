/**
 * CSRF Token API Endpoint
 *
 * Generates and returns a CSRF token for client-side requests
 *
 * @module api/csrf
 */

import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security/csrf';

export async function GET() {
  const token = generateCsrfToken();

  return NextResponse.json({
    token,
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
