/**
 * Auth Service Integration Tests
 * Tests against real Supabase database
 */

import { AuthService } from '../../auth.service'
import { supabase, testAdminCredentials, verifySeededData } from '../setup/integration-setup'

describe('AuthService Integration Tests', () => {
  let authService: AuthService

  beforeAll(async () => {
    await verifySeededData()
    authService = new AuthService(supabase) // Use raw Supabase client, not wrapper
  })

  afterEach(async () => {
    // Logout after each test
    await authService.logout()
  })

  describe('Real Authentication', () => {
    it('should login with real super admin credentials', async () => {
      const result = await authService.login(testAdminCredentials.superAdmin)
      
      expect(result.success).toBe(true)
      expect(result.data?.user.role).toBe('super_admin')
      expect(result.data?.user.email).toBe(testAdminCredentials.superAdmin.email)
      expect(result.data?.token).toBeDefined()
    })

    it('should login with palika admin credentials', async () => {
      const result = await authService.login(testAdminCredentials.palikaAdmin)
      
      expect(result.success).toBe(true)
      expect(result.data?.user.role).toBe('palika_admin')
      expect(result.data?.user.palika_id).toBeDefined()
    })

    it('should login with moderator credentials', async () => {
      const result = await authService.login(testAdminCredentials.moderator)
      
      expect(result.success).toBe(true)
      expect(result.data?.user.role).toBe('moderator')
    })

    it('should fail with invalid credentials', async () => {
      const result = await authService.login({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid')
    })

    it('should maintain session after login', async () => {
      await authService.login(testAdminCredentials.superAdmin)
      
      expect(authService.isAuthenticated()).toBe(true)
      expect(authService.getCurrentUser()?.role).toBe('super_admin')
    })

    it('should clear session after logout', async () => {
      await authService.login(testAdminCredentials.superAdmin)
      await authService.logout()
      
      expect(authService.isAuthenticated()).toBe(false)
      expect(authService.getCurrentUser()).toBeNull()
    })
  })

  describe('Real Permissions', () => {
    it('should grant all permissions to super admin', async () => {
      await authService.login(testAdminCredentials.superAdmin)
      
      expect(authService.hasPermission('manage_heritage_sites')).toBe(true)
      expect(authService.hasPermission('manage_users')).toBe(true)
      expect(authService.hasPermission('manage_admins')).toBe(true)
      expect(authService.hasPermission('any.permission')).toBe(true)
    })

    it('should limit moderator permissions', async () => {
      await authService.login(testAdminCredentials.moderator)
      
      // Moderator has: moderate_content, manage_reviews, view_reports
      expect(authService.hasPermission('moderate_content')).toBe(true)
      expect(authService.hasPermission('manage_reviews')).toBe(true)
      expect(authService.hasPermission('view_reports')).toBe(true)
      expect(authService.hasPermission('manage_heritage_sites')).toBe(false)
      expect(authService.hasPermission('manage_users')).toBe(false)
    })

    it('should enforce palika scope for palika admin', async () => {
      await authService.login(testAdminCredentials.palikaAdmin)
      
      const user = authService.getCurrentUser()
      const userPalikaId = user?.palika_id
      
      // Palika admin has: manage_heritage_sites, manage_events, manage_businesses, view_analytics
      expect(authService.hasPermission('manage_heritage_sites', { palika_id: userPalikaId! })).toBe(true)
      expect(authService.hasPermission('manage_events', { palika_id: userPalikaId! })).toBe(true)
      
      // Should NOT have permission in different palika
      expect(authService.hasPermission('manage_heritage_sites', { palika_id: 999 })).toBe(false)
    })
  })
})