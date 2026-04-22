/**
 * Test User Helper
 *
 * Creates and manages test admin users for E2E tests.
 * Uses mock admin users defined in admin-panel/lib/mock-admin-users.ts
 */

import { ADMIN_PANEL } from './context'

export interface TestUser {
  id: string
  email: string
  password: string
  full_name: string
  role: string
  palika_id?: number
  cookie: string
}

/**
 * Mock admin users built-in for testing
 * No registration needed - these are pre-defined accounts
 */
export const MOCK_TEST_USERS = {
  SUPER_ADMIN: {
    email: 'super@admin.com',
    password: 'super123456',
    role: 'super_admin',
    full_name: 'Super Admin',
  },
  PALIKA_ADMIN: {
    email: 'palika@admin.com',
    password: 'palika123456',
    role: 'palika_admin',
    full_name: 'Palika Admin',
    palika_id: 5, // Kathmandu Metro
  },
  DISTRICT_ADMIN: {
    email: 'district@admin.com',
    password: 'district123456',
    role: 'district_admin',
    full_name: 'District Admin',
  },
  TEST_USER: {
    email: 'test@admin.com',
    password: 'test123456',
    role: 'palika_admin',
    full_name: 'Test User',
    palika_id: 5,
  },
} as const

/**
 * Login with a test user and return cookie + user data
 * Uses mock auth - no real Supabase auth needed
 */
export async function loginTestUser(
  credentials: {
    email: string
    password: string
  }
): Promise<TestUser> {
  try {
    const res = await fetch(`${ADMIN_PANEL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })

    if (res.status !== 200) {
      const body = await res.text()
      throw new Error(`Login failed (${res.status}): ${body}`)
    }

    const setCookie = res.headers.get('set-cookie') ?? ''
    const match = setCookie.match(/admin_session=[^;]+/)
    if (!match) throw new Error(`No admin_session cookie in response`)

    const userData = await res.json()
    return {
      id: userData.user.id,
      email: userData.user.email,
      full_name: userData.user.full_name,
      role: userData.user.role,
      palika_id: userData.user.palika_id,
      password: credentials.password,
      cookie: match[0],
    }
  } catch (err) {
    throw new Error(`Failed to login test user: ${err}`)
  }
}

/**
 * Convenience: Login as palika admin (most common for gallery tests)
 */
export async function loginPalikaAdminTestUser(): Promise<TestUser> {
  return loginTestUser({
    email: MOCK_TEST_USERS.PALIKA_ADMIN.email,
    password: MOCK_TEST_USERS.PALIKA_ADMIN.password,
  })
}

/**
 * Convenience: Login as super admin
 */
export async function loginSuperAdminTestUser(): Promise<TestUser> {
  return loginTestUser({
    email: MOCK_TEST_USERS.SUPER_ADMIN.email,
    password: MOCK_TEST_USERS.SUPER_ADMIN.password,
  })
}

/**
 * Create an authenticated fetch function for a test user
 */
export function makeTestUserFetch(user: TestUser) {
  return async function fetch(
    path: string,
    init: RequestInit = {}
  ): Promise<{ status: number; json: any; text: string }> {
    const res = await global.fetch(`${ADMIN_PANEL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        cookie: user.cookie,
        ...(init.headers ?? {}),
      },
    })

    const text = await res.text()
    let json: any = null
    try {
      json = JSON.parse(text)
    } catch {
      /* non-JSON */
    }

    return { status: res.status, json, text }
  }
}
