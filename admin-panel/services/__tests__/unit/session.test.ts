import { describe, it, expect, beforeAll } from 'vitest'

beforeAll(() => {
  // Force a long enough secret so the production branch is exercised, not the mock fallback.
  process.env.ADMIN_SESSION_SECRET = 'x'.repeat(48)
})

describe('session cookie sign/verify', () => {
  it('round-trips valid payload', async () => {
    const { signSessionCookie, verifySessionCookie } = await import('@/lib/server/session')
    const token = signSessionCookie({
      sub: 'admin-1',
      role_name: 'palika_admin',
      hierarchy_level: 'palika',
      palika_id: 5,
      district_id: 301,
      province_id: 3,
    })
    const payload = verifySessionCookie(token)
    expect(payload).not.toBeNull()
    expect(payload!.sub).toBe('admin-1')
    expect(payload!.role_name).toBe('palika_admin')
    expect(payload!.palika_id).toBe(5)
    expect(payload!.exp).toBeGreaterThan(payload!.iat)
  })

  it('rejects tampered body', async () => {
    const { signSessionCookie, verifySessionCookie } = await import('@/lib/server/session')
    const token = signSessionCookie({
      sub: 'admin-1',
      role_name: 'palika_admin',
      hierarchy_level: 'palika',
      palika_id: 5,
      district_id: 301,
      province_id: 3,
    })
    const [body, sig] = token.split('.')
    // flip one char in the base64url body
    const flipped = body.slice(0, -1) + (body.slice(-1) === 'a' ? 'b' : 'a')
    expect(verifySessionCookie(`${flipped}.${sig}`)).toBeNull()
  })

  it('rejects tampered signature', async () => {
    const { signSessionCookie, verifySessionCookie } = await import('@/lib/server/session')
    const token = signSessionCookie({
      sub: 'admin-1',
      role_name: 'palika_admin',
      hierarchy_level: 'palika',
      palika_id: 5,
      district_id: 301,
      province_id: 3,
    })
    const [body, sig] = token.split('.')
    const flipped = sig.slice(0, -1) + (sig.slice(-1) === 'a' ? 'b' : 'a')
    expect(verifySessionCookie(`${body}.${flipped}`)).toBeNull()
  })

  it('rejects malformed token', async () => {
    const { verifySessionCookie } = await import('@/lib/server/session')
    expect(verifySessionCookie('not-a-token')).toBeNull()
    expect(verifySessionCookie('only-one-part')).toBeNull()
    expect(verifySessionCookie('a.b.c')).toBeNull()
  })

  it('rejects expired token', async () => {
    const { verifySessionCookie } = await import('@/lib/server/session')
    const { createHmac } = await import('crypto')
    const secret = process.env.ADMIN_SESSION_SECRET!
    const payload = {
      sub: 'admin-1',
      role_name: 'palika_admin',
      hierarchy_level: 'palika',
      palika_id: 5,
      district_id: 301,
      province_id: 3,
      iat: 1000,
      exp: 1001, // long expired
    }
    const body = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const sig = createHmac('sha256', secret).update(body).digest().toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    expect(verifySessionCookie(`${body}.${sig}`)).toBeNull()
  })
})
