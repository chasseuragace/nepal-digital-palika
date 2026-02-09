import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Use service role key for development/testing to bypass RLS
// In production, use proper authentication
const apiKey = process.env.NODE_ENV === 'development' && supabaseServiceKey 
  ? supabaseServiceKey 
  : supabaseAnonKey

export const supabase = createClient(supabaseUrl, apiKey)
