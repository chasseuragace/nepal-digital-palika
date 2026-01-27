import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)

    // Fetch role
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, hierarchy_level, description, description_ne')
      .eq('id', roleId)
      .single()

    if (roleError) {
      console.error('Supabase error:', roleError)
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    // Fetch permissions for this role
    const { data: permissions, error: permError } = await supabaseAdmin
      .from('role_permissions')
      .select('permission_id, permissions(id, name, resource, action, description)')
      .eq('role_id', roleId)

    if (permError) {
      console.error('Error fetching permissions:', permError)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        ...role,
        permissions: permissions?.map(p => p.permissions) || []
      }
    })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)
    const body = await request.json()
    const { name, hierarchy_level, description, description_ne } = body

    // Validate required fields
    if (!name || !hierarchy_level) {
      return NextResponse.json(
        { error: 'Name and hierarchy_level are required' },
        { status: 400 }
      )
    }

    // Update role
    const { data: role, error } = await supabaseAdmin
      .from('roles')
      .update({
        name,
        hierarchy_level,
        description: description || '',
        description_ne: description_ne || ''
      })
      .eq('id', roleId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ data: role?.[0] })
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)

    // Delete role (cascade will handle role_permissions)
    const { error } = await supabaseAdmin
      .from('roles')
      .delete()
      .eq('id', roleId)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
