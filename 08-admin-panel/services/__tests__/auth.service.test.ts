/**
 * Auth Service Tests
 * Tests authentication, session management, and permissions
 */

import { AuthService } from '../auth.service'
import { createMockClient } from '../database-client'
import { AdminUser } from '../types'

describe('AuthService', () => {
  // Mock data
  const mockAdminUsers = [
    {
      id: 'admin-1',
      email: 'admin@palika.gov.np',
      full_name: 'Admin User',
      role: 'super_admin',
      palika_id: 1,
      permissions: [],
      is_active: true,
      password_hash: 'admin123'
    },
    {
      id: 'admin-2',
      email: 'moderator@palika.gov.np',
      full_name: 'Moderator User',
      role: 'moderator',
      palika_id: 1,
      permissions: [],
      is_active: true,
      password_hash: 'admin123'
    },
    {
      id: 'admin-3',
      email: 'inactive@palika.gov.np',
      full_name: 'Inactive User',
      role: 'support',
      palika_id: 1,
      permissions: [],
      is_active: false,
      password_hash: 'admin123'
    }
  ]

  const mockSessions: any[] = []

  let authService: AuthService

  beforeEach(() => {
    const mockDb = createMockClient({
      temp_admin_users: mockAdminUsers,
      temp_admin_sessions: mockSessions
    })
    authService = new AuthService(mockDb)
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const result = await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.user.email).toBe('admin@palika.gov.np')
      expect(result.data?.token).toBeDefined()
    })

    it('should fail login with invalid email', async () => {
      const result = await authService.login({
        email: 'nonexistent@palika.gov.np',
        password: 'admin123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should fail login with invalid password', async () => {
      const result = await authService.login({
        email: 'admin@palika.gov.np',
        password: 'wrongpassword'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should fail login for inactive user', async () => {
      const result = await authService.login({
        email: 'inactive@palika.gov.np',
        password: 'admin123'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email or password')
    })

    it('should fail login with empty credentials', async () => {
      const result = await authService.login({
        email: '',
        password: ''
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email and password are required')
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      // First login
      await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })

      // Then logout
      const result = await authService.logout()

      expect(result.success).toBe(true)
      expect(authService.getCurrentSession()).toBeNull()
    })

    it('should handle logout when not logged in', async () => {
      const result = await authService.logout()
      expect(result.success).toBe(true)
    })
  })

  describe('getCurrentUser', () => {
    it('should return null when not logged in', () => {
      expect(authService.getCurrentUser()).toBeNull()
    })

    it('should return user after login', async () => {
      await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })

      const user = authService.getCurrentUser()
      expect(user).toBeDefined()
      expect(user?.email).toBe('admin@palika.gov.np')
    })
  })

  describe('isAuthenticated', () => {
    it('should return false when not logged in', () => {
      expect(authService.isAuthenticated()).toBe(false)
    })

    it('should return true after login', async () => {
      await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })

      expect(authService.isAuthenticated()).toBe(true)
    })

    it('should return false after logout', async () => {
      await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })
      await authService.logout()

      expect(authService.isAuthenticated()).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('should return false when not logged in', () => {
      expect(authService.hasPermission('heritage_sites.create')).toBe(false)
    })

    it('should return true for super_admin on any permission', async () => {
      await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })

      expect(authService.hasPermission('heritage_sites.create')).toBe(true)
      expect(authService.hasPermission('events.delete')).toBe(true)
      expect(authService.hasPermission('any.permission')).toBe(true)
    })

    it('should check specific permissions for moderator', async () => {
      await authService.login({
        email: 'moderator@palika.gov.np',
        password: 'admin123'
      })

      // Moderator should have these permissions
      expect(authService.hasPermission('heritage_sites.create')).toBe(true)
      expect(authService.hasPermission('heritage_sites.read')).toBe(true)
      expect(authService.hasPermission('heritage_sites.update')).toBe(true)

      // Moderator should NOT have delete permission
      expect(authService.hasPermission('heritage_sites.delete')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true if user has any of the permissions', async () => {
      await authService.login({
        email: 'moderator@palika.gov.np',
        password: 'admin123'
      })

      expect(authService.hasAnyPermission([
        'heritage_sites.delete',
        'heritage_sites.create'
      ])).toBe(true)
    })

    it('should return false if user has none of the permissions', async () => {
      await authService.login({
        email: 'moderator@palika.gov.np',
        password: 'admin123'
      })

      expect(authService.hasAnyPermission([
        'heritage_sites.delete',
        'users.manage'
      ])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', async () => {
      await authService.login({
        email: 'admin@palika.gov.np',
        password: 'admin123'
      })

      expect(authService.hasAllPermissions([
        'heritage_sites.create',
        'heritage_sites.delete',
        'events.create'
      ])).toBe(true)
    })

    it('should return false if user is missing any permission', async () => {
      await authService.login({
        email: 'moderator@palika.gov.np',
        password: 'admin123'
      })

      expect(authService.hasAllPermissions([
        'heritage_sites.create',
        'heritage_sites.delete'
      ])).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('should return all permissions for super_admin', () => {
      const permissions = authService.getRolePermissions('super_admin')
      expect(permissions).toContain('*')
    })

    it('should return specific permissions for palika_admin', () => {
      const permissions = authService.getRolePermissions('palika_admin')
      expect(permissions).toContain('heritage_sites.create')
      expect(permissions).toContain('heritage_sites.delete')
      expect(permissions).toContain('analytics.read')
    })

    it('should return limited permissions for support', () => {
      const permissions = authService.getRolePermissions('support')
      expect(permissions).toContain('heritage_sites.read')
      expect(permissions).not.toContain('heritage_sites.create')
      expect(permissions).not.toContain('heritage_sites.delete')
    })

    it('should return empty array for unknown role', () => {
      const permissions = authService.getRolePermissions('unknown_role')
      expect(permissions).toEqual([])
    })
  })
})
