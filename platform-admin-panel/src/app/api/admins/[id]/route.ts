import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * DELETE /api/admins/[id]
 * Deletes an admin user (hard delete from both auth and admin_users)
 * Uses service role key for secure deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const id = params.id

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Step 1: Delete from admin_users table
    const { error: adminError } = await serviceClient
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (adminError) {
      return NextResponse.json(
        { error: `Failed to delete admin profile: ${adminError.message}` },
        { status: 400 }
      )
    }

    // Step 2: Delete from auth.users
    try {
      await serviceClient.auth.admin.deleteUser(id)
    } catch (authError: any) {
      // Auth user might already be deleted or doesn't exist
      // Log but don't fail
      console.warn(`Warning: Could not delete auth user ${id}:`, authError.message)
    }

    return NextResponse.json(
      { message: 'Admin user deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete admin'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
