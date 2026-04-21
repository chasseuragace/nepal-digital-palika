/**
 * Admin panel API smoke tests.
 *
 * Purpose: re-runnable confirmation that every HTTP API the admin panel
 * exposes is functional end-to-end — route handler → service → datasource →
 * real Supabase. These hit a live dev server.
 *
 * Prerequisites (must be satisfied before running):
 *   1. Supabase running                 : `supabase status`
 *   2. Fresh db + SQL seeds applied     : `supabase db reset --yes`
 *   3. Admin users + admin_regions + palika tiers seeded:
 *         cd database
 *         npx tsx scripts/seed-admin-users.ts
 *         (and the admin_regions / tier-assignment SQL from setup-production.sh)
 *   4. Admin panel dev server up on :3000 with real Supabase + real auth:
 *         # in admin-panel/.env.local
 *         NEXT_PUBLIC_USE_FAKE_DATASOURCES=false
 *         NEXT_PUBLIC_USE_MOCK_AUTH=false
 *         ADMIN_SESSION_SECRET=<32+ chars>
 *         npm run dev
 *
 * Run:
 *   cd admin-panel
 *   npx vitest run services/__tests__/integration/admin-api-smoke.integration.test.ts
 *
 * Notes:
 *   - The admin panel uses a signed httpOnly cookie (`admin_session`) set by
 *     `/api/auth/login`. All tests authenticate once in `beforeAll` and reuse
 *     that cookie. We log in as the Kathmandu palika admin so palika-scoped
 *     endpoints (heritage-sites, events, blog-posts, etc.) have a concrete
 *     scope to assert against.
 *   - A failing endpoint does not fail the whole run — each test is isolated.
 *     Read the table printed at the end to see which endpoints are broken.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const BASE = process.env.ADMIN_PANEL_BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.ADMIN_PANEL_TEST_EMAIL ?? 'palika.admin@kathmandu.gov.np'
const PASSWORD = process.env.ADMIN_PANEL_TEST_PASSWORD ?? 'KathmanduAdmin456!'

let sessionCookie = ''
let callerPalikaId: number | null = null
const results: { path: string; status: number; note?: string }[] = []

async function call(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; json: any; text: string }> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionCookie ? { cookie: sessionCookie } : {}),
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  let json: any = null
  try { json = JSON.parse(text) } catch { /* non-JSON */ }
  results.push({ path, status: res.status })
  return { status: res.status, json, text }
}

beforeAll(async () => {
  // Sanity: dev server reachable?
  let reachable = false
  try {
    const r = await fetch(`${BASE}/api/auth/me`)
    reachable = r.status !== undefined
  } catch { /* handled below */ }
  if (!reachable) {
    throw new Error(
      `Admin panel dev server not reachable at ${BASE}. ` +
      `Start it first: (cd admin-panel && npm run dev)`
    )
  }

  // Log in and capture cookie.
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (loginRes.status !== 200) {
    const body = await loginRes.text()
    throw new Error(
      `Login failed (${loginRes.status}). Body: ${body}\n` +
      `Ensure the admin user exists (run seed-admin-users.ts) and that ` +
      `NEXT_PUBLIC_USE_MOCK_AUTH=false in admin-panel/.env.local.`
    )
  }
  const setCookie = loginRes.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/admin_session=[^;]+/)
  if (!match) throw new Error(`No admin_session cookie in login response: ${setCookie}`)
  sessionCookie = match[0]

  const loginJson = await loginRes.json()
  callerPalikaId = loginJson.user?.palika_id ?? null
  if (!callerPalikaId) {
    throw new Error(
      `Logged-in admin has no palika_id — prerequisite violated. ` +
      `Either seed-admin-users.ts mis-mapped the palika, or the admin was ` +
      `seeded before geography. Current user: ${JSON.stringify(loginJson.user)}`
    )
  }
})

afterAll(() => {
  // Summary table so a single glance tells you what's broken.
  const table = results
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((r) => {
      const ok = r.status >= 200 && r.status < 300
      return `  ${ok ? '✓' : '✗'}  ${r.status}  ${r.path}`
    })
    .join('\n')
  console.log('\n──────── API smoke summary ────────\n' + table + '\n')
})

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

describe('auth', () => {
  it('GET /api/auth/me returns the logged-in caller', async () => {
    const { status, json } = await call('/api/auth/me')
    expect(status).toBe(200)
    expect(json?.success).toBe(true)
    expect(json?.caller?.role_name).toBe('palika_admin')
    expect(json?.caller?.palika_id).toBe(callerPalikaId)
  })
})

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

describe('dashboard', () => {
  it('GET /api/dashboard/stats returns counts', async () => {
    const { status, json } = await call('/api/dashboard/stats')
    expect(status).toBe(200)
    expect(json).toBeTruthy()
  })
})

/* -------------------------------------------------------------------------- */
/* Palika profile / geography                                                  */
/* -------------------------------------------------------------------------- */

describe('palika', () => {
  it('GET /api/palikas returns list', async () => {
    const { status, json } = await call('/api/palikas')
    expect(status).toBe(200)
    expect(Array.isArray(json?.data ?? json)).toBe(true)
  })

  it('GET /api/palikas/provinces returns all 7', async () => {
    const { status, json } = await call('/api/palikas/provinces')
    expect(status).toBe(200)
    const arr = json?.data ?? json
    expect(Array.isArray(arr)).toBe(true)
    expect(arr.length).toBeGreaterThanOrEqual(7)
  })

  it('GET /api/palikas/districts?province_id= returns list', async () => {
    // Route requires province_id; pick Bagmati (3) which contains Kathmandu + Bhaktapur.
    const { status, json } = await call('/api/palikas/districts?province_id=3')
    expect(status).toBe(200)
    expect(Array.isArray(json?.data ?? json)).toBe(true)
  })

  it('GET /api/palikas/[id] returns the caller’s palika', async () => {
    const { status, json } = await call(`/api/palikas/${callerPalikaId}`)
    expect(status).toBe(200)
    expect(json?.data?.id ?? json?.id).toBe(callerPalikaId)
  })

  it('GET /api/palika-profile?palika_id=<callerPalikaId>', async () => {
    const { status } = await call(`/api/palika-profile?palika_id=${callerPalikaId}`)
    expect([200, 404]).toContain(status) // 404 if profile row not yet created
  })

  it('GET /api/tier-info returns the palika tier', async () => {
    const { status, json } = await call(`/api/tier-info?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
    expect(json?.palikaId).toBe(callerPalikaId)
    expect(json?.tierName).toBeTruthy()
  })

  it('GET /api/tiers?palika_id= returns subscription tiers', async () => {
    const { status, json } = await call(`/api/tiers?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
    expect(json).toBeTruthy()
  })
})

/* -------------------------------------------------------------------------- */
/* Content: heritage / events / blog / categories                              */
/* -------------------------------------------------------------------------- */

describe('content', () => {
  it('GET /api/heritage-sites', async () => {
    const { status, json } = await call('/api/heritage-sites')
    expect(status).toBe(200)
    expect(json).toBeTruthy()
  })

  it('GET /api/events', async () => {
    const { status, json } = await call('/api/events')
    expect(status).toBe(200)
    expect(json).toBeTruthy()
  })

  it('GET /api/blog-posts', async () => {
    const { status, json } = await call('/api/blog-posts')
    expect(status).toBe(200)
    expect(json).toBeTruthy()
  })

  it('GET /api/categories', async () => {
    const { status, json } = await call('/api/categories')
    expect(status).toBe(200)
    expect(Array.isArray(json)).toBe(true)
  })
})

/* -------------------------------------------------------------------------- */
/* Businesses + targeting                                                      */
/* -------------------------------------------------------------------------- */

describe('businesses', () => {
  it('GET /api/businesses?palika_id= returns list', async () => {
    const { status, json } = await call(`/api/businesses?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
    expect(json).toBeTruthy()
    expect(Array.isArray(json?.businesses ?? json?.data ?? json)).toBe(true)
  })

  it('GET /api/business-targeting', async () => {
    const { status } = await call('/api/business-targeting')
    expect([200, 204]).toContain(status)
  })

  it('GET /api/business-targeting/filter-options', async () => {
    const { status } = await call('/api/business-targeting/filter-options')
    expect(status).toBe(200)
  })

  it('GET /api/business-targeting/stats', async () => {
    const { status } = await call('/api/business-targeting/stats')
    expect(status).toBe(200)
  })
})

/* -------------------------------------------------------------------------- */
/* Admins + regions + audit                                                    */
/* -------------------------------------------------------------------------- */

describe('admins', () => {
  it('GET /api/admins (palika admin scope)', async () => {
    const { status, json } = await call('/api/admins')
    expect(status).toBe(200)
    const arr = json?.data ?? json
    expect(Array.isArray(arr)).toBe(true)
    // Palika admin should only see admins in their own palika.
    for (const a of arr) {
      expect(a.palika_id).toBe(callerPalikaId)
    }
  })

  it('GET /api/regions', async () => {
    const { status, json } = await call('/api/regions')
    expect(status).toBe(200)
    const arr = json?.data ?? json
    expect(Array.isArray(arr)).toBe(true)
    expect(arr.length).toBeGreaterThanOrEqual(7) // 7 provinces
  })

  it('GET /api/audit-log', async () => {
    const { status, json } = await call('/api/audit-log')
    expect([200, 403]).toContain(status)
    if (status === 200) expect(json).toBeTruthy()
  })
})

/* -------------------------------------------------------------------------- */
/* Analytics                                                                   */
/* -------------------------------------------------------------------------- */

describe('analytics', () => {
  it('GET /api/analytics/summary?palika_id=', async () => {
    const { status } = await call(`/api/analytics/summary?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
  })

  it('GET /api/analytics/businesses?palika_id=', async () => {
    const { status } = await call(`/api/analytics/businesses?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
  })

  it('GET /api/analytics/products?palika_id=', async () => {
    const { status } = await call(`/api/analytics/products?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
  })

  it('GET /api/analytics/users?palika_id=', async () => {
    const { status } = await call(`/api/analytics/users?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
  })
})

/* -------------------------------------------------------------------------- */
/* Operations: SOS / service providers / notifications / tier change reqs      */
/* -------------------------------------------------------------------------- */

describe('operations', () => {
  it('GET /api/sos-requests', async () => {
    const { status } = await call('/api/sos-requests')
    expect(status).toBe(200)
  })

  it('GET /api/service-providers', async () => {
    const { status } = await call('/api/service-providers')
    expect(status).toBe(200)
  })

  it('GET /api/notifications', async () => {
    const { status } = await call('/api/notifications')
    expect([200, 204]).toContain(status)
  })

  it('GET /api/notifications-v2', async () => {
    const { status } = await call('/api/notifications-v2')
    expect([200, 204]).toContain(status)
  })

  it('GET /api/tier-change-requests?palika_id=', async () => {
    const { status } = await call(`/api/tier-change-requests?palika_id=${callerPalikaId}`)
    expect(status).toBe(200)
  })

  it('GET /api/palika-gallery', async () => {
    const { status } = await call(`/api/palika-gallery?palika_id=${callerPalikaId}`)
    expect([200, 404]).toContain(status)
  })

  it('GET /api/products?palika_id=', async () => {
    const { status } = await call(`/api/products?palika_id=${callerPalikaId}`)
    expect([200, 204]).toContain(status)
  })
})

/* -------------------------------------------------------------------------- */
/* Rejection: request without auth must be blocked                             */
/* -------------------------------------------------------------------------- */

describe('auth boundary', () => {
  it('an unauthenticated request to /api/auth/me is 401', async () => {
    const r = await fetch(`${BASE}/api/auth/me`)
    expect(r.status).toBe(401)
  })
})
