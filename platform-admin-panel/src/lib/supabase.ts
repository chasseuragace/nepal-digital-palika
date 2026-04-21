import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
// Platform-admin-panel is an internal ops tool — all routes run server-side
// and must use the service-role key to bypass RLS. The env var name matches
// admin-panel's convention (SUPABASE_SERVICE_ROLE_KEY), not the old
// NEXT_PUBLIC_SUPABASE_SERVICE_KEY which was never populated in any .env
// this project ships.
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY // legacy fallback

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const apiKey = supabaseServiceKey || supabaseAnonKey
if (!supabaseServiceKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[platform-admin supabase] SUPABASE_SERVICE_ROLE_KEY not set — ' +
      'falling back to anon key. RLS-protected rows will be invisible.'
  )
}

export const supabase = createClient(supabaseUrl, apiKey)
