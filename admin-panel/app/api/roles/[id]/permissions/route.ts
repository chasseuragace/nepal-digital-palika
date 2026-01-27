import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)

    // Fetch permissions for this role
    const { data: permissions, error } = await supabaseAdmin
      .from('role_permissions')
      .select('permission_id, permissions(id, name, resource, action, description)')
      .eq('role_id', roleId)

    if (error) {
      console.error('Error fetching permissions:', error)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    return NextResponse.json({
      data: permissions?.map(p => p.permissions) || []
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
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
    const { permissionIds } = body

    if (!Array.isArray(permissionIds)) {
      return NextResponse.json(
        { error: 'permissionIds must be an array' },
        { status: 400 }
      )
    }

    // Delete existing permissions for this role
    const { error: deleteError } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)

    if (deleteError) {
      console.error('Error deleting permissions:', deleteError)
      return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
    }

    // Insert new permissions
    if (permissionIds.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('role_permissions')
        .insert(
          permissionIds.map(permissionId => ({
            role_id: roleId,
            permission_id: permissionId
          }))
        )

      if (insertError) {
        console.error('Error inserting permissions:', insertError)
        return NextResponse.json({ error: 'Failed to update permissions' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)
    const body = await request.json()
    const { permissionId } = body

    if (!permissionId) {
      return NextResponse.json(
        { error: 'permissionId is required' },
        { status: 400 }
      )
    }

    // Check if permission already assigned
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('role_permissions')
      .select('*')
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking permission:', checkError)
      return NextResponse.json({ error: 'Failed to assign permission' }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Permission already assigned to this role' },
        { status: 409 }
      )
    }

    // Assign permission
    const { error: insertError } = await supabaseAdmin
      .from('role_permissions')
      .insert([
        {
          role_id: roleId,
          permission_id: permissionId
        }
      ])

    if (insertError) {
      console.error('Error assigning permission:', insertError)
      return NextResponse.json({ error: 'Failed to assign permission' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error assigning permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roleId = parseInt(params.id)
    const searchParams = request.nextUrl.searchParams
    const permissionId = parseInt(searchParams.get('permissionId') || '0')

    if (!permissionId) {
      return NextResponse.json(
        { error: 'permissionId is required' },
        { status: 400 }
      )
    }

    // Remove permission
    const { error } = await supabaseAdmin
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId)

    if (error) {
      console.error('Error removing permission:', error)
      return NextResponse.json({ error: 'Failed to remove permission' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing permission:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
