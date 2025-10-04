import { createClient } from '@supabase/supabase-js'
// createBrowserClient import removed - not used in this file

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const _supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key (for admin operations)
let _adminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public',
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