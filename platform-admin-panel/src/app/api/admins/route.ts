import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/admins
 * Returns all admin users
 * Uses service role key to bypass RLS (infinite recursion issue)
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await serviceClient
      .from('admin_users')
      .select(`
        id,
        full_name,
        role,
        palika_id,
        is_active,
        created_at,
        palikas(
          id,
          name_en,
          district_id,
          districts(
            id,
            name_en,
            province_id,
            provinces(
              id,
              name_en
            )
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch admins'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admins
 * Creates a new admin user
 * Uses service role key to create auth user and admin profile
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { email, password, full_name, role, palika_id } = body

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, full_name, role' },
        { status: 400 }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Create auth user
    const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirmed: true,
      user_metadata: { full_name },
    })

    if (authError) {
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'No user data returned from auth creation' },
        { status: 500 }
      )
    }

    // Step 2: Create admin_users record
    const { data: adminData, error: adminError } = await serviceClient
      .from('admin_users')
      .insert({
        id: authData.user.id,
        full_name,
        role,
        palika_id: palika_id || null,
        is_active: true,
      })
      .select(
        `
        id,
        full_name,
        role,
        palika_id,
        is_active,
        created_at,
        palikas(
          id,
          name_en,
          district_id,
          districts(
            id,
            name_en,
            province_id,
            provinces(
              id,
              name_en
            )
          )
        )
      `
      )
      .single()

    if (adminError) {
      // Clean up: delete the auth user if admin profile creation fails
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: `Failed to create admin profile: ${adminError.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { data: adminData, message: 'Admin user created successfully' },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create admin'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
