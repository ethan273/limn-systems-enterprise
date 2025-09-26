import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Server-side client with service role key (for admin operations)
let _adminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _adminClient
}

// IMPORTANT: Only use these server-side (API routes, server components)
// For client-side operations, use getSupabaseBrowserClient() from @/lib/supabase-browser

// Legacy exports for backward compatibility - use getSupabaseAdmin() for new code
export { getSupabaseAdmin as supabaseAdmin }
export { getSupabaseAdmin as supabase }