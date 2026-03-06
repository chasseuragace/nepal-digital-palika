import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/auth/me
 * Returns current user's admin profile using server-side auth
 * Bypasses RLS by using service role key
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify JWT and extract user ID
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    // Create client with anon key to verify the token
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: sessionData, error: sessionError } = await anonClient.auth.getUser(token)

    if (sessionError || !sessionData.user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Create service role client to fetch admin user (bypasses RLS)
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
    const { data: adminUser, error: dbError } = await serviceClient
      .from('admin_users')
      .select('id, full_name, role, palika_id, created_at')
      .eq('id', sessionData.user.id)
      .single()

    if (dbError || !adminUser) {
      return NextResponse.json(
        { error: 'Admin profile not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        user: {
          id: adminUser.id,
          auth_id: adminUser.id,
          full_name: adminUser.full_name,
          email: sessionData.user.email || '',
          role: adminUser.role,
          palika_id: adminUser.palika_id,
          created_at: adminUser.created_at,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user'
    console.error('GET /api/auth/me error:', message)
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
