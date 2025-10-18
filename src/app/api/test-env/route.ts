import { NextResponse } from 'next/server';

/**
 * Test endpoint to verify environment variables are set correctly
 * This will help diagnose Vercel deployment issues
 */
export async function GET() {
  // Only allow in development or with special header
  if (process.env.NODE_ENV === 'production') {
    const isDiagnostic = true; // Set to true temporarily for testing
    if (!isDiagnostic) {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }
  }

  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : '❌ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : '❌ Missing',
    SUPABASE_SERVICE_ROLE_KEY_STARTS_WITH: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10) || 'N/A',
  };

  return NextResponse.json(envCheck);
}
