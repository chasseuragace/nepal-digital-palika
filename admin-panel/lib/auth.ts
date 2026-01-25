import { supabaseAdmin } from './supabase'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: string
  palika_id?: number
  is_active: boolean
}

export async function authenticateAdmin(email: string, password: string): Promise<AdminUser | null> {
  try {
    // Authenticate using Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
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
      is_active: adminUser.is_active
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