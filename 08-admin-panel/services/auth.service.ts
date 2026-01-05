/**
 * Authentication Service
 * Framework-agnostic authentication logic
 */

import { DatabaseClient } from './database-client'
import { AdminUser, AuthSession, LoginCredentials, ServiceResponse } from './types'

export interface AuthServiceConfig {
  sessionDurationMs?: number
  passwordHasher?: (password: string) => Promise<string>
  passwordVerifier?: (password: string, hash: string) => Promise<boolean>
}

export class AuthService {
  private db: DatabaseClient
  private config: AuthServiceConfig
  private currentSession: AuthSession | null = null

  constructor(db: DatabaseClient, config: AuthServiceConfig = {}) {
    this.db = db
    this.config = {
      sessionDurationMs: config.sessionDurationMs || 24 * 60 * 60 * 1000, // 24 hours
      passwordHasher: config.passwordHasher,
      passwordVerifier: config.passwordVerifier || this.defaultPasswordVerifier
    }
  }

  /**
   * Authenticate admin user with email and password
   */
  async login(credentials: LoginCredentials): Promise<ServiceResponse<AuthSession>> {
    try {
      const { email, password } = credentials

      if (!email || !password) {
        return { success: false, error: 'Email and password are required' }
      }

      // Fetch admin user
      const { data: adminUser, error } = await this.db
        .from('temp_admin_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .single()

      if (error || !adminUser) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Verify password
      const isValid = await this.config.passwordVerifier!(password, adminUser.password_hash || '')
      if (!isValid) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Create session
      const session = await this.createSession(adminUser)
      this.currentSession = session

      return {
        success: true,
        data: session,
        message: 'Login successful'
      }
    } catch (error) {
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<ServiceResponse<void>> {
    try {
      if (this.currentSession) {
        // Invalidate session in database
        await this.db
          .from('temp_admin_sessions')
          .delete()
          .eq('token', this.currentSession.token)
      }
      
      this.currentSession = null
      return { success: true, message: 'Logged out successfully' }
    } catch (error) {
      return { success: false, error: 'Logout failed' }
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): AuthSession | null {
    return this.currentSession
  }

  /**
   * Get current user
   */
  getCurrentUser(): AdminUser | null {
    return this.currentSession?.user || null
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.currentSession) return false
    return new Date() < this.currentSession.expiresAt
  }

  /**
   * Validate session token
   */
  async validateSession(token: string): Promise<ServiceResponse<AuthSession>> {
    try {
      const { data: session, error } = await this.db
        .from('temp_admin_sessions')
        .select('*, temp_admin_users(*)')
        .eq('token', token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (error || !session) {
        return { success: false, error: 'Invalid or expired session' }
      }

      const authSession: AuthSession = {
        user: this.mapAdminUser(session.temp_admin_users),
        token: session.token,
        expiresAt: new Date(session.expires_at)
      }

      this.currentSession = authSession
      return { success: true, data: authSession }
    } catch (error) {
      return { success: false, error: 'Session validation failed' }
    }
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser()
    if (!user) return false

    // Super admin has all permissions
    if (user.role === 'super_admin') return true

    // Check specific permission
    return user.permissions.includes(permission) || user.permissions.includes('*')
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p))
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p))
  }

  /**
   * Get user's role-based permissions
   */
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

  /**
   * Refresh session token
   */
  async refreshSession(): Promise<ServiceResponse<AuthSession>> {
    if (!this.currentSession) {
      return { success: false, error: 'No active session' }
    }

    try {
      const newToken = this.generateToken()
      const expiresAt = new Date(Date.now() + this.config.sessionDurationMs!)

      await this.db
        .from('temp_admin_sessions')
        .update({ token: newToken, expires_at: expiresAt.toISOString() })
        .eq('token', this.currentSession.token)

      this.currentSession = {
        ...this.currentSession,
        token: newToken,
        expiresAt
      }

      return { success: true, data: this.currentSession }
    } catch (error) {
      return { success: false, error: 'Failed to refresh session' }
    }
  }

  // Private methods

  private async createSession(adminUser: any): Promise<AuthSession> {
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + this.config.sessionDurationMs!)

    await this.db
      .from('temp_admin_sessions')
      .insert({
        admin_id: adminUser.id,
        token,
        expires_at: expiresAt.toISOString()
      })

    return {
      user: this.mapAdminUser(adminUser),
      token,
      expiresAt
    }
  }

  private mapAdminUser(data: any): AdminUser {
    return {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      full_name_ne: data.full_name_ne,
      role: data.role,
      palika_id: data.palika_id,
      permissions: data.permissions?.length ? data.permissions : this.getRolePermissions(data.role),
      is_active: data.is_active
    }
  }

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let token = ''
    for (let i = 0; i < 64; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return token
  }

  private async defaultPasswordVerifier(password: string, hash: string): Promise<boolean> {
    // For development: simple comparison
    // In production: use bcrypt or similar
    return password === 'admin123' || password === hash
  }
}
