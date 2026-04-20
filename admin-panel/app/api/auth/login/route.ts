import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { findMockAdminByEmail } from '@/lib/mock-admin-users'
import { supabaseAdmin } from '@/lib/supabase'
import { signSessionCookie, sessionCookieHeader } from '@/lib/server/session'

const USE_MOCK_AUTH = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateAdmin(email, password)

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    let hierarchy_level: 'national' | 'province' | 'district' | 'palika' = 'palika'
    let province_id: number | null = null
    let district_id: number | null = user.district_id ?? null
    let palika_id: number | null = user.palika_id ?? null

    if (USE_MOCK_AUTH) {
      const mock = findMockAdminByEmail(email)
      if (mock) {
        hierarchy_level = mock.hierarchy_level
        province_id = mock.province_id ?? null
        district_id = mock.district_id ?? null
        palika_id = mock.palika_id ?? null
      }
    } else {
      const { data } = await supabaseAdmin
        .from('admin_users')
        .select('hierarchy_level, province_id, district_id, palika_id')
        .eq('id', user.id)
        .single()
      if (data) {
        hierarchy_level = data.hierarchy_level ?? 'palika'
        province_id = data.province_id ?? null
        district_id = data.district_id ?? null
        palika_id = data.palika_id ?? null
      }
    }

    const token = signSessionCookie({
      sub: user.id,
      role_name: user.role,
      hierarchy_level,
      palika_id,
      district_id,
      province_id,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        hierarchy_level,
        province_id,
        district_id,
        palika_id,
      },
    })
    response.headers.set('Set-Cookie', sessionCookieHeader(token))
    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
