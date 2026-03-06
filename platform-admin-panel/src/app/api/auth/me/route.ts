import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

/**
 * GET /api/auth/me
 * Returns current user's admin profile using server-side auth
 * Bypasses RLS by using service role key
 */
export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header from the request
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '')

    // Verify the token and get the user ID
    const { data: sessionData, error: sessionError } = await supabaseServer.auth.getUser(token)
    if (sessionError || !sessionData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch admin user record (using service role, bypasses RLS)
    const { data: adminUser, error: dbError } = await supabaseServer
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
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
