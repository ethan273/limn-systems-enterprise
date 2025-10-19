import { createClient } from '@supabase/supabase-js'
// createBrowserClient import removed - not used in this file

// Server-side client with service role key (for admin operations)
let _adminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

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
  }
  return _adminClient
}

// IMPORTANT: Only use these server-side (API routes, server components)
// For client-side operations, use getSupabaseBrowserClient() from @/lib/supabase-browser

// Legacy exports for backward compatibility - use getSupabaseAdmin() for new code
export { getSupabaseAdmin as supabaseAdmin }
export { getSupabaseAdmin as supabase }