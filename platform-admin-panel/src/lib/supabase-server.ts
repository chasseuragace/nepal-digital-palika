import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase environment variables (server-side)')
}

/**
 * Server-side Supabase client using service role key
 * Bypasses RLS policies - use only in trusted server code
 */
export const supabaseServer = createClient(supabaseUrl, serviceRoleKey)
