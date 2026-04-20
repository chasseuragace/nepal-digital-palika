/**
 * Mock Admin Users Data
 * Pre-generated test accounts for development
 *
 * Passwords stored in plain text (ONLY FOR MOCK/DEV - never do this in production)
 * Region IDs align with lib/fake-regions-datasource.ts.
 */

export type MockAdminRole =
  | 'super_admin'
  | 'province_admin'
  | 'district_admin'
  | 'palika_admin'
  | 'moderator'
  | 'support_agent'
  | 'content_editor'
  | 'content_reviewer'

export type MockHierarchyLevel = 'national' | 'province' | 'district' | 'palika'

export interface MockAdminUser {
  id: string
  email: string
  password: string
  full_name: string
  role: MockAdminRole
  hierarchy_level: MockHierarchyLevel
  province_id?: number
  district_id?: number
  palika_id?: number
  created_at: string
}

/**
 * Pre-generated mock admins. IDs below match fake-regions-datasource.ts:
 *   Bagmati province = 3, Kathmandu district = 301,
 *   Kathmandu Metro palika = 5, Bhaktapur Muni palika = 10.
 */
export const MOCK_ADMIN_USERS: MockAdminUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'super@admin.com',
    password: 'super123456',
    full_name: 'Super Admin',
    role: 'super_admin',
    hierarchy_level: 'national',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440010',
    email: 'province@admin.com',
    password: 'province123456',
    full_name: 'Province Admin - Bagmati',
    role: 'province_admin',
    hierarchy_level: 'province',
    province_id: 3,
    created_at: new Date('2026-01-10').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'district@admin.com',
    password: 'district123456',
    full_name: 'District Admin - Kathmandu',
    role: 'district_admin',
    hierarchy_level: 'district',
    province_id: 3,
    district_id: 301,
    created_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'palika@admin.com',
    password: 'palika123456',
    full_name: 'Palika Admin - Kathmandu Metro',
    role: 'palika_admin',
    hierarchy_level: 'palika',
    province_id: 3,
    district_id: 301,
    palika_id: 5,
    created_at: new Date('2026-02-01').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'test@admin.com',
    password: 'testpass123456',
    full_name: 'Test Admin - Bhaktapur',
    role: 'palika_admin',
    hierarchy_level: 'palika',
    province_id: 3,
    district_id: 303,
    palika_id: 10,
    created_at: new Date('2026-02-15').toISOString(),
  },
]

export function findMockAdminByEmail(email: string): MockAdminUser | undefined {
  return MOCK_ADMIN_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function findMockAdminById(id: string): MockAdminUser | undefined {
  return MOCK_ADMIN_USERS.find((u) => u.id === id)
}

export function validatePassword(user: MockAdminUser, password: string): boolean {
  return user.password === password
}

export function generateMockToken(userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `mock_${userId}_${timestamp}_${random}`
}

export function mockAdminToDTO(user: MockAdminUser) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: { full_name: user.full_name },
  }
}
