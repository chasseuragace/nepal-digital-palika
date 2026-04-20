/**
 * Mock Supabase Auth API (Server-side)
 * Simulates Supabase auth methods for Next.js server operations
 *
 * Used when NEXT_PUBLIC_USE_MOCK_AUTH=true in .env.local
 * Provides admin.auth.admin.createUser(), signInWithPassword(), etc.
 */

import {
  MOCK_ADMIN_USERS,
  findMockAdminByEmail,
  findMockAdminById,
  validatePassword,
  generateMockToken,
  mockAdminToDTO,
} from './mock-admin-users'

export interface MockAuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
  }
  created_at: string
}

export interface MockAuthSession {
  user: MockAuthUser
  session: {
    access_token: string
    refresh_token: string
    expires_in: number
    expires_at: number
    token_type: string
  }
}

/**
 * Mock Admin Auth API
 * Methods for creating, updating, deleting users (server-side admin operations)
 */
class MockAdminAuthApi {
  /**
   * Create a new user
   */
  async createUser(credentials: { email: string; password?: string; user_metadata?: any }) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    // Check if email exists
    if (findMockAdminByEmail(credentials.email)) {
      return {
        data: { user: null },
        error: new Error('User already exists'),
      }
    }

    // Create new user
    const newUser: MockAuthUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      user_metadata: credentials.user_metadata || {},
      created_at: new Date().toISOString(),
    }

    // Add to mock users (in real app this would hit Supabase)
    MOCK_ADMIN_USERS.push({
      id: newUser.id,
      email: credentials.email,
      password: credentials.password || 'temp_password_123456',
      full_name: credentials.user_metadata?.full_name || 'New Admin',
      role: credentials.user_metadata?.role || 'palika_admin',
      hierarchy_level: credentials.user_metadata?.hierarchy_level || 'palika',
      province_id: credentials.user_metadata?.province_id,
      district_id: credentials.user_metadata?.district_id,
      palika_id: credentials.user_metadata?.palika_id,
      created_at: newUser.created_at,
    })

    console.log(`[MockAuth] User created: ${credentials.email}`)
    return { data: { user: newUser }, error: null }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    const userIndex = MOCK_ADMIN_USERS.findIndex((u) => u.id === userId)
    if (userIndex >= 0) {
      MOCK_ADMIN_USERS.splice(userIndex, 1)
      console.log(`[MockAuth] User deleted: ${userId}`)
    }

    return { data: null, error: null }
  }

  /**
   * Update a user
   */
  async updateUserById(userId: string, attributes: any) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    const user = findMockAdminById(userId)
    if (!user) {
      return { data: { user: null }, error: new Error('User not found') }
    }

    // Update allowed fields
    if (attributes.email) user.email = attributes.email
    if (attributes.password) user.password = attributes.password
    if (attributes.user_metadata?.full_name) user.full_name = attributes.user_metadata.full_name

    console.log(`[MockAuth] User updated: ${userId}`)
    return { data: { user: mockAdminToDTO(user) }, error: null }
  }

  /**
   * Get a user by ID
   */
  async getUserById(userId: string) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 50))

    const user = findMockAdminById(userId)
    if (!user) {
      return { data: { user: null }, error: new Error('User not found') }
    }

    return { data: { user: mockAdminToDTO(user) }, error: null }
  }

  /**
   * List all users
   */
  async listUsers() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200))

    const users = MOCK_ADMIN_USERS.map(mockAdminToDTO)
    return { data: { users }, error: null }
  }
}

/**
 * Mock Auth API
 * Methods for user authentication (sign in, sign up, etc.)
 */
class MockAuthApi {
  /**
   * Sign in with email and password
   */
  async signInWithPassword(credentials: { email: string; password: string }) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 150))

    // Find user
    const user = findMockAdminByEmail(credentials.email)
    if (!user) {
      return {
        data: { user: null, session: null },
        error: new Error('Invalid email or password'),
      }
    }

    // Validate password
    if (!validatePassword(user, credentials.password)) {
      return {
        data: { user: null, session: null },
        error: new Error('Invalid email or password'),
      }
    }

    // Create session
    const expiresIn = 86400 // 24 hours
    const session: MockAuthSession['session'] = {
      access_token: generateMockToken(user.id),
      refresh_token: generateMockToken(user.id + '_refresh'),
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      token_type: 'Bearer',
    }

    console.log(`[MockAuth] User signed in: ${credentials.email}`)
    return {
      data: {
        user: mockAdminToDTO(user),
        session,
      },
      error: null,
    }
  }

  /**
   * Sign up new user
   */
  async signUp(credentials: { email: string; password: string }) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 200))

    if (!credentials.email || !credentials.password) {
      return {
        data: { user: null, session: null },
        error: new Error('Email and password are required'),
      }
    }

    if (credentials.password.length < 8) {
      return {
        data: { user: null, session: null },
        error: new Error('Password must be at least 8 characters'),
      }
    }

    // Check if email exists
    if (findMockAdminByEmail(credentials.email)) {
      return {
        data: { user: null, session: null },
        error: new Error('Email already registered'),
      }
    }

    // Create new user
    const newUser: MockAuthUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: credentials.email,
      user_metadata: { full_name: 'New User' },
      created_at: new Date().toISOString(),
    }

    MOCK_ADMIN_USERS.push({
      id: newUser.id,
      email: credentials.email,
      password: credentials.password,
      full_name: 'New User',
      role: 'palika_admin',
      hierarchy_level: 'palika',
      created_at: newUser.created_at,
    })

    // Create session
    const expiresIn = 86400
    const session: MockAuthSession['session'] = {
      access_token: generateMockToken(newUser.id),
      refresh_token: generateMockToken(newUser.id + '_refresh'),
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      token_type: 'Bearer',
    }

    console.log(`[MockAuth] User registered: ${credentials.email}`)
    return {
      data: {
        user: newUser,
        session,
      },
      error: null,
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    console.log('[MockAuth] User signed out')
    return { error: null }
  }

  /**
   * Get current user from session
   */
  async getUser() {
    // This would normally get from session cookies
    // For mock, return null (let session middleware handle it)
    return { data: { user: null }, error: null }
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken: string) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))

    // In mock, just create new tokens
    const expiresIn = 86400
    const session: MockAuthSession['session'] = {
      access_token: generateMockToken('refreshed_' + Date.now()),
      refresh_token: generateMockToken('refresh_' + Date.now()),
      expires_in: expiresIn,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      token_type: 'Bearer',
    }

    console.log('[MockAuth] Session refreshed')
    return { data: { session }, error: null }
  }

  // Admin API
  admin = new MockAdminAuthApi()
}

/**
 * Create mock Supabase auth client
 */
export function createMockSupabaseAuth() {
  return new MockAuthApi()
}

export type MockSupabaseAuthClient = MockAuthApi
