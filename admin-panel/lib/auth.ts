import { supabase, supabaseAdmin } from './supabase'
import { findMockAdminByEmail, validatePassword } from './mock-admin-users'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  palika_id?: number
  district_id?: number
  is_active: boolean
}

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  try {
    if (USE_MOCK_AUTH) {
      // Mock auth mode - use in-memory users
      const mockUser = findMockAdminByEmail(email)

      if (!mockUser || !validatePassword(mockUser, password)) {
        console.error('[MockAuth] Invalid credentials for:', email)
        return null
      }

      console.log('[MockAuth] User authenticated:', email)
      return {
        id: mockUser.id,
        email: mockUser.email,
        full_name: mockUser.full_name,
        role: mockUser.role,
        palika_id: mockUser.palika_id,
        district_id: mockUser.district_id,
        is_active: true, // Mock users are always active
      }
    }

    // Real Supabase auth mode
    // Authenticate using Supabase Auth (with anon key)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      console.error('Auth error:', authError?.message)
      return null
    }

    // Get admin profile from admin_users table
    const { data: adminUser, error: profileError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !adminUser) {
      console.error('Profile error:', profileError?.message)
      return null
    }

    return {
      id: adminUser.id,
      email: authData.user.email!,
      full_name: adminUser.full_name,
      role: adminUser.role,
      palika_id: adminUser.palika_id,
      district_id: adminUser.district_id,
      is_active: adminUser.is_active,
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function hasPermission(userRole: string, requiredPermission: string): boolean {
  const rolePermissions: Record<string, string[]> = {
    'super_admin': ['*'], // All permissions
    'palika_admin': [
      'heritage_sites.create',
      'heritage_sites.edit',
      'heritage_sites.delete',
      'events.create',
      'events.edit',
      'events.delete',
      'blog_posts.create',
      'blog_posts.edit',
      'blog_posts.delete',
      'users.manage'
    ],
    'content_moderator': [
      'heritage_sites.create',
      'heritage_sites.edit',
      'events.create',
      'events.edit',
      'blog_posts.create',
      'blog_posts.edit'
    ]
  }

  const permissions = rolePermissions[userRole] || []
  return permissions.includes('*') || permissions.includes(requiredPermission)
}