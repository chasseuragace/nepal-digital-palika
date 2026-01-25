import { SupabaseClient } from '@supabase/supabase-js'
import { AdminUser, AuthSession, LoginCredentials, ServiceResponse } from './types'

export interface AuthServiceConfig {
  // Optional config for future use
}

export class AuthService {
  private supabase: SupabaseClient | any // Allow mock client
  private currentSession: AuthSession | null = null

  constructor(supabase: SupabaseClient | any, config?: AuthServiceConfig) {
    this.supabase = supabase
  }

  /**
   * Authenticate admin user with email and password using Supabase Auth.
   */
  async login(credentials: LoginCredentials): Promise<ServiceResponse<AuthSession>> {
    const { email, password } = credentials
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' }
    }

    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.session) {
      return { success: false, error: authError?.message || 'Invalid email or password' }
    }

    // After successful login, fetch the admin profile
    const { data: adminProfile, error: profileError } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !adminProfile) {
      await this.logout() // Log out if profile doesn't exist
      return { success: false, error: 'Admin profile not found.' }
    }

    const session = this.mapSupabaseSession(authData.session, adminProfile)
    this.currentSession = session

    return {
      success: true,
      data: session,
      message: 'Login successful',
    }
  }

  /**
   * Logout current user using Supabase Auth.
   */
  async logout(): Promise<ServiceResponse<void>> {
    const { error } = await this.supabase.auth.signOut()
    if (error) {
      return { success: false, error: 'Logout failed' }
    }
    this.currentSession = null
    return { success: true, message: 'Logged out successfully' }
  }

  /**
   * Get current session from Supabase and map it to our AuthSession type.
   */
  async getSession(): Promise<AuthSession | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession()

    if (error || !session) {
      this.currentSession = null
      return null
    }
    
    // Check if we already have the profile data
    if (this.currentSession?.token === session.access_token) {
      return this.currentSession
    }

    const { data: adminProfile } = await this.supabase
      .from('admin_users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!adminProfile) return null

    this.currentSession = this.mapSupabaseSession(session, adminProfile)
    return this.currentSession
  }

  getCurrentUser(): AdminUser | null {
    return this.currentSession?.user || null
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession
  }

  isAuthenticated(): boolean {
    return !!this.currentSession
  }

  /**
   * Check if user has specific permission, optionally within a scope
   */
  hasPermission(permission: string, scope?: { palika_id: number }): boolean {
    const user = this.getCurrentUser()
    if (!user) return false

    if (user.role === 'super_admin') return true

    if (scope?.palika_id && user.palika_id !== scope.palika_id) {
      return false
    }

    return user.permissions.includes(permission) || user.permissions.includes('*')
  }

  hasAnyPermission(permissions: string[], scope?: { palika_id: number }): boolean {
    return permissions.some(p => this.hasPermission(p, scope))
  }

  hasAllPermissions(permissions: string[], scope?: { palika_id: number }): boolean {
    return permissions.every(p => this.hasPermission(p, scope))
  }

  getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'super_admin': ['*'],
      'palika_admin': [
        'heritage_sites.create', 'heritage_sites.read', 'heritage_sites.update', 'heritage_sites.delete',
        'events.create', 'events.read', 'events.update', 'events.delete',
        'blog_posts.create', 'blog_posts.read', 'blog_posts.update', 'blog_posts.delete',
        'businesses.read', 'businesses.verify',
        'users.read', 'users.manage',
        'analytics.read'
      ],
      'moderator': [
        'heritage_sites.create', 'heritage_sites.read', 'heritage_sites.update',
        'events.create', 'events.read', 'events.update',
        'blog_posts.create', 'blog_posts.read', 'blog_posts.update',
        'businesses.read'
      ],
      'support': [
        'heritage_sites.read',
        'events.read',
        'blog_posts.read',
        'businesses.read',
        'users.read'
      ]
    }
    return rolePermissions[role] || []
  }

  // Private methods

  private mapAdminUser(profileData: any, authEmail?: string): AdminUser {
    // Get permissions from database or use role-based defaults
    let permissions = profileData.permissions || []
    
    // If no permissions in DB, use role-based defaults
    if (!permissions || permissions.length === 0) {
      permissions = this.getRolePermissions(profileData.role)
    }
    
    return {
      id: profileData.id,
      email: authEmail || profileData.email || '',
      full_name: profileData.full_name,
      full_name_ne: profileData.full_name_ne,
      role: profileData.role,
      palika_id: profileData.palika_id,
      permissions: permissions,
      is_active: profileData.is_active,
    }
  }

  private mapSupabaseSession(session: any, profile: any): AuthSession {
    const adminUser = this.mapAdminUser(profile, session.user.email)
    
    return {
      user: adminUser,
      token: session.access_token,
      expiresAt: new Date(session.expires_at * 1000),
    }
  }
}
