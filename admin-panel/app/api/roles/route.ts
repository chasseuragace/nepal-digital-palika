import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('roles')
      .select('id, name, hierarchy_level, description, description_ne', { count: 'exact' })

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Get total count
    const { count: total, error: countError } = await query

    if (countError) {
      console.error('Supabase count error:', countError)
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    // Get paginated data
    const { data: roles, error } = await supabaseAdmin
      .from('roles')
      .select('id, name, hierarchy_level, description, description_ne')
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
    }

    // Fetch permissions for each role
    const rolesWithPermissions = await Promise.all(
      (roles || []).map(async (role) => {
        const { data: permissions, error: permError } = await supabaseAdmin
          .from('role_permissions')
          .select('permission_id, permissions(id, name, resource, action)')
          .eq('role_id', role.id)

        if (permError) {
          console.error('Error fetching permissions for role:', permError)
          return { ...role, permissions: [] }
        }

        return {
          ...role,
          permissions: permissions?.map(p => p.permissions) || []
        }
      })
    )

    return NextResponse.json({
      data: rolesWithPermissions,
      total: total || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, hierarchy_level, description, description_ne } = body

    // Validate required fields
    if (!name || !hierarchy_level) {
      return NextResponse.json(
        { error: 'Name and hierarchy_level are required' },
        { status: 400 }
      )
    }

    // Create role
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .insert([
        {
          name,
          hierarchy_level,
          description: description || '',
          description_ne: description_ne || ''
        }
      ])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
    }

    return NextResponse.json({ data: role?.[0] }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
