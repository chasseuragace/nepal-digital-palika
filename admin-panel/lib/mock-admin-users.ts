/**
 * Mock Admin Users Data
 * Pre-generated test accounts for development
 *
 * Passwords stored in plain text (ONLY FOR MOCK/DEV - never do this in production)
 * All users are pre-assigned to palikas to avoid region selection
 */

export interface MockAdminUser {
  id: string
  email: string
  password: string
  full_name: string
  role: 'super_admin' | 'district_admin' | 'palika_admin'
  palika_id?: number
  district_id?: number
  created_at: string
}

/**
 * Pre-generated mock admins for testing
 * Linked to real palika/district hierarchy
 */
export const MOCK_ADMIN_USERS: MockAdminUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'super@admin.com',
    password: 'super123456', // min 8 chars
    full_name: 'Super Admin',
    role: 'super_admin',
    created_at: new Date('2026-01-01').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'district@admin.com',
    password: 'district123456',
    full_name: 'District Admin - Kathmandu',
    role: 'district_admin',
    district_id: 3, // Kathmandu District
    created_at: new Date('2026-01-15').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'palika@admin.com',
    password: 'palika123456',
    full_name: 'Palika Admin - Kathmandu',
    role: 'palika_admin',
    palika_id: 1, // Kathmandu Metropolitan City
    district_id: 3,
    created_at: new Date('2026-02-01').toISOString(),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'test@admin.com',
    password: 'testpass123456',
    full_name: 'Test Admin',
    role: 'palika_admin',
    palika_id: 2, // Bhaktapur Municipality
    district_id: 3,
    created_at: new Date('2026-02-15').toISOString(),
  },
]

/**
 * Find user by email
 */
export function findMockAdminByEmail(email: string): MockAdminUser | undefined {
  return MOCK_ADMIN_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

/**
 * Find user by ID
 */
export function findMockAdminById(id: string): MockAdminUser | undefined {
  return MOCK_ADMIN_USERS.find((u) => u.id === id)
}

/**
 * Validate password against user
 */
export function validatePassword(user: MockAdminUser, password: string): boolean {
  // In mock mode, simple string comparison (not production-safe)
  return user.password === password
}

/**
 * Generate mock JWT token (not real JWT, just mock)
 */
export function generateMockToken(userId: string): string {
  // Format: mock_<userId>_<timestamp>_<random>
  // This is NOT a real JWT - just for mock testing
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)
  return `mock_${userId}_${timestamp}_${random}`
}

/**
 * Convert MockAdminUser to auth response (excludes password)
 */
export function mockAdminToDTO(user: MockAdminUser) {
  return {
    id: user.id,
    email: user.email,
    user_metadata: {
      full_name: user.full_name,
    },
  }
}
