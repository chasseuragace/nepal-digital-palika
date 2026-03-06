import { supabase } from './supabase'
import { AdminUser } from './types'

/**
 * Authenticates user with email/password and fetches admin user data
 */
export async function authenticateAdmin(email: string, password: string): Promise<AdminUser> {
  // Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    throw new Error('Invalid email or password')
  }

  // Fetch admin user record (id = auth.users.id)
  const { data: adminUser, error: dbError } = await supabase
    .from('admin_users')
    .select('id, full_name, role, palika_id, created_at')
    .eq('id', authData.user.id)
    .single()

  if (dbError || !adminUser) {
    // Sign out if no admin record found
    await supabase.auth.signOut()
    throw new Error('Admin account not found')
  }

  return {
    id: adminUser.id,
    auth_id: adminUser.id,
    full_name: adminUser.full_name,
    email: authData.user.email || '',
    role: adminUser.role,
    palika_id: adminUser.palika_id,
    created_at: adminUser.created_at,
  }
}

/**
 * Gets the current authenticated session
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) {
    return null
  }
  return data.session
}

/**
 * Signs out the current user
 */
export async function signOut() {
  await supabase.auth.signOut()
}
