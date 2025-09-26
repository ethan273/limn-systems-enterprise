import { createBrowserClient } from '@supabase/ssr'

// Client-side browser client with anon key (for user operations, authentication, storage)
let _browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  // Only create client in browser environment
  if (typeof window === 'undefined') {
    // Return null during SSR, don't throw error
    return null as any
  }

  if (_browserClient) return _browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(`Missing Supabase environment variables. URL: ${url ? 'present' : 'missing'}, Key: ${key ? 'present' : 'missing'}`)
  }

  _browserClient = createBrowserClient(url, key)
  return _browserClient
}