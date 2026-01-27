import { describe, it, expect } from 'vitest'
import { hasPermission } from '../../../lib/auth'

describe('Authentication and Permissions', () => {
  describe('hasPermission', () => {
    it('should grant all permissions to super_admin', () => {
      expect(hasPermission('super_admin', 'heritage_sites.create')).toBe(true)
      expect(hasPermission('super_admin', 'events.delete')).toBe(true)
      expect(hasPermission('super_admin', 'users.manage')).toBe(true)
      expect(hasPermission('super_admin', 'any.permission')).toBe(true)
    })

    it('should grant specific permissions to palika_admin', () => {
      expect(hasPermission('palika_admin', 'heritage_sites.create')).toBe(true)
      expect(hasPermission('palika_admin', 'heritage_sites.edit')).toBe(true)
      expect(hasPermission('palika_admin', 'heritage_sites.delete')).toBe(true)
      expect(hasPermission('palika_admin', 'events.create')).toBe(true)
      expect(hasPermission('palika_admin', 'blog_posts.create')).toBe(true)
      expect(hasPermission('palika_admin', 'users.manage')).toBe(true)
    })

    it('should deny permissions not assigned to palika_admin', () => {
      expect(hasPermission('palika_admin', 'admin.manage')).toBe(false)
      expect(hasPermission('palika_admin', 'roles.manage')).toBe(false)
    })

    it('should grant specific permissions to content_moderator', () => {
      expect(hasPermission('content_moderator', 'heritage_sites.create')).toBe(true)
      expect(hasPermission('content_moderator', 'heritage_sites.edit')).toBe(true)
      expect(hasPermission('content_moderator', 'events.create')).toBe(true)
      expect(hasPermission('content_moderator', 'blog_posts.create')).toBe(true)
    })

    it('should deny delete permissions to content_moderator', () => {
      expect(hasPermission('content_moderator', 'heritage_sites.delete')).toBe(false)
      expect(hasPermission('content_moderator', 'events.delete')).toBe(false)
      expect(hasPermission('content_moderator', 'users.manage')).toBe(false)
    })

    it('should deny all permissions to unknown role', () => {
      expect(hasPermission('unknown_role', 'heritage_sites.create')).toBe(false)
      expect(hasPermission('unknown_role', 'events.create')).toBe(false)
    })
  })
})
