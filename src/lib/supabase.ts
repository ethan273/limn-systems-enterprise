import { createClient } from '@supabase/supabase-js'
// createBrowserClient import removed - not used in this file

// Server-side client with service role key (for admin operations)
let _adminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // CRITICAL DEBUG: Log env var status in production
    console.log('[getSupabaseAdmin] Environment check:', {
      hasUrl: !!supabaseUrl,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
      hasServiceKey: !!supabaseServiceKey,
      serviceKeyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'MISSING',
      nodeEnv: process.env.NODE_ENV,
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      const missingVars: string[] = [];
      if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
      if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

      const errorMessage = [
        '🚨 SUPABASE CONFIGURATION ERROR 🚨',
        '',
        `Missing required environment variables: ${missingVars.join(', ')}`,
        '',
        'If deploying to Vercel:',
        '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
        '2. Add the missing variables for Production, Preview, and Development',
        '3. Redeploy your application',
        '',
        'If running locally:',
        '1. Copy .env.example to .env.local',
        '2. Fill in your Supabase credentials',
        '3. Restart your dev server',
        '',
        'See VERCEL_DEPLOYMENT.md for detailed instructions',
      ].join('\n');

      console.error(errorMessage);
      throw new Error(
        `Supabase configuration missing: ${missingVars.join(', ')} are required for database operations. ` +
        `See VERCEL_DEPLOYMENT.md for setup instructions.`
      )
    }

    _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public' as any,
      },
      global: {
        headers: {
          'X-Client-Info': 'supabase-js-node',
        },
      },
      auth: {
        persistSession: false,
      },
    })

    // DIAGNOSTIC: Test database connectivity and permissions
    // This runs only once when the client is first created
    ;(async () => {
      try {
        console.log('[getSupabaseAdmin] Testing database connectivity...');

        // Test 1: Can we query a table?
        const testQuery = await _adminClient!.from('orders').select('id').limit(1);

        if (testQuery.error) {
          console.error('[getSupabaseAdmin] ❌ Database test FAILED:', {
            code: testQuery.error.code,
            message: testQuery.error.message,
            details: testQuery.error.details,
            hint: testQuery.error.hint,
          });

          // Check if it's a permission error
          if (testQuery.error.code === '42501') {
            console.error('[getSupabaseAdmin] 🚨 PERMISSION DENIED ERROR:');
            console.error('  This suggests the SUPABASE_SERVICE_ROLE_KEY may be incorrect.');
            console.error('  The service role key should have full database access.');
            console.error('  Please verify in Vercel Dashboard that:');
            console.error('  1. SUPABASE_SERVICE_ROLE_KEY contains the SERVICE ROLE key (not the anon key)');
            console.error('  2. The key is from the correct Supabase project');
            console.error('  3. The key matches the NEXT_PUBLIC_SUPABASE_URL');
          }

          // Check if it's a "table not found" error
          if (testQuery.error.code === '42P01' || testQuery.error.message?.includes('does not exist')) {
            console.error('[getSupabaseAdmin] 🚨 TABLE NOT FOUND ERROR:');
            console.error('  The "orders" table does not exist in the database.');
            console.error('  This suggests you may be pointing to the wrong Supabase project.');
            console.error('  Please verify NEXT_PUBLIC_SUPABASE_URL points to the correct project.');
          }
        } else {
          console.log('[getSupabaseAdmin] ✅ Database test PASSED - successfully queried orders table');
        }
      } catch (testError) {
        console.error('[getSupabaseAdmin] ❌ Database test threw exception:', testError);
      }
    })();
  }
  return _adminClient
}

// IMPORTANT: Only use these server-side (API routes, server components)
// For client-side operations, use getSupabaseBrowserClient() from @/lib/supabase-browser

// Legacy exports for backward compatibility - use getSupabaseAdmin() for new code
export { getSupabaseAdmin as supabaseAdmin }
export { getSupabaseAdmin as supabase }