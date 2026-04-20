import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { findMockAdminById, MOCK_ADMIN_USERS } from '@/lib/mock-admin-users'

const COOKIE_NAME = 'admin_session'
const MAX_AGE_SECONDS = 60 * 60 * 8 // 8 hours
const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (secret && secret.length >= 32) return secret
  if (USE_MOCK_AUTH) {
    console.warn('[session] ADMIN_SESSION_SECRET not set or too short; using dev-only fallback. Set a 32+ char secret before any non-mock deployment.')
    return 'dev-only-fallback-secret-do-not-use-in-prod-0123456789'
  }
  throw new Error('ADMIN_SESSION_SECRET must be set to at least 32 characters in non-mock mode')
}

export interface SessionPayload {
  sub: string
  role_name: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  palika_id: number | null
  district_id: number | null
  province_id: number | null
  iat: number
  exp: number
}

export interface CallerContext {
  id: string
  role_name: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  palika_id: number | null
  district_id: number | null
  province_id: number | null
  permissions: string[]
  is_active: boolean
}

function base64urlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((input.length + 3) % 4)
  return Buffer.from(padded, 'base64')
}

export function signSessionCookie(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
  const now = Math.floor(Date.now() / 1000)
  const full: SessionPayload = { ...payload, iat: now, exp: now + MAX_AGE_SECONDS }
  const body = base64urlEncode(JSON.stringify(full))
  const sig = base64urlEncode(createHmac('sha256', getSecret()).update(body).digest())
  return `${body}.${sig}`
}

export function verifySessionCookie(token: string): SessionPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = base64urlEncode(createHmac('sha256', getSecret()).update(body).digest())
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const payload = JSON.parse(base64urlDecode(body).toString('utf8')) as SessionPayload
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp !== 'number' || payload.exp < now) return null
    return payload
  } catch {
    return null
  }
}

export function sessionCookieHeader(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`
}

export function clearedCookieHeader(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=; HttpOnly${secure}; SameSite=Lax; Path=/; Max-Age=0`
}

function readCookieFromRequest(request: NextRequest): string | null {
  const direct = request.cookies.get(COOKIE_NAME)?.value
  if (direct) return direct
  const header = request.headers.get('cookie')
  if (!header) return null
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE_NAME) return rest.join('=')
  }
  return null
}

async function loadMockPermissions(roleName: string): Promise<string[]> {
  // Mirrors seed in migration 20250127000008 + 20250127000014.
  const MOCK_ROLE_PERMISSIONS: Record<string, string[]> = {
    super_admin: [
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts', 'manage_businesses',
      'manage_sos', 'moderate_content', 'manage_admins', 'manage_roles', 'view_audit_log',
      'manage_regions', 'manage_categories', 'view_analytics',
    ],
    province_admin: [
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts', 'manage_businesses',
      'manage_sos', 'moderate_content', 'manage_categories',
    ],
    district_admin: [
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts', 'manage_businesses',
      'manage_sos', 'moderate_content', 'manage_categories',
    ],
    palika_admin: [
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts', 'manage_businesses',
      'manage_sos', 'moderate_content', 'manage_categories',
    ],
    content_editor: [
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts', 'manage_businesses',
      'manage_categories',
    ],
    content_reviewer: [
      'manage_heritage_sites', 'manage_events', 'manage_blog_posts', 'manage_businesses',
      'moderate_content',
    ],
    support_agent: ['manage_sos', 'view_analytics'],
    moderator: ['moderate_content', 'view_analytics'],
  }
  return MOCK_ROLE_PERMISSIONS[roleName] ?? []
}

async function loadRealPermissions(adminId: string): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('roles!inner(role_permissions(permissions(name)))')
    .eq('id', adminId)
    .single()
  if (error || !data) return []
  const role = (data as any).roles
  const rp = role?.role_permissions ?? []
  const names: string[] = []
  for (const row of rp) {
    const name = row?.permissions?.name
    if (typeof name === 'string') names.push(name)
  }
  return names
}

export async function getCallerFromRequest(request: NextRequest): Promise<CallerContext | null> {
  const token = readCookieFromRequest(request)
  if (!token) return null
  const payload = verifySessionCookie(token)
  if (!payload) return null

  if (USE_MOCK_AUTH) {
    const mock = findMockAdminById(payload.sub)
    if (!mock) return null
    return {
      id: mock.id,
      role_name: payload.role_name,
      hierarchy_level: payload.hierarchy_level,
      palika_id: payload.palika_id,
      district_id: payload.district_id,
      province_id: payload.province_id,
      permissions: await loadMockPermissions(payload.role_name),
      is_active: true,
    }
  }

  const { data, error } = await supabaseAdmin
    .from('admin_users')
    .select('id, role, hierarchy_level, palika_id, district_id, province_id, is_active')
    .eq('id', payload.sub)
    .single()
  if (error || !data || !data.is_active) return null
  return {
    id: data.id,
    role_name: data.role,
    hierarchy_level: data.hierarchy_level,
    palika_id: data.palika_id,
    district_id: data.district_id,
    province_id: data.province_id,
    permissions: await loadRealPermissions(data.id),
    is_active: data.is_active,
  }
}

export const SESSION_COOKIE_NAME = COOKIE_NAME

// Helper for the mock path to resolve all mocks, used by the GET admins route
// tests and seed scripts. Keep exports clean.
export function __mockAdminUsers() {
  return MOCK_ADMIN_USERS
}
