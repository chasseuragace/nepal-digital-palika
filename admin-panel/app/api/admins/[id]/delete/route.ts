import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface DeleteAdminResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * POST /api/admins/[id]/delete
 * Delete an admin and cascade delete associated admin_regions records
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteAdminResponse>> {
  try {
    const adminId = params.id

    // Verify admin exists
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('id, full_name')
      .eq('id', adminId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admin' },
        { status: 500 }
      )
    }

    // Delete admin_regions records (CASCADE will handle this, but we can be explicit)
    const { error: regionsDeleteError } = await supabaseAdmin
      .from('admin_regions')
      .delete()
      .eq('admin_id', adminId)

    if (regionsDeleteError) {
      console.error('Error deleting admin_regions:', regionsDeleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete admin regions' },
        { status: 500 }
      )
    }

    // Delete admin_users record
    const { error: adminDeleteError } = await supabaseAdmin
      .from('admin_users')
      .delete()
      .eq('id', adminId)

    if (adminDeleteError) {
      console.error('Error deleting admin:', adminDeleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete admin' },
        { status: 500 }
      )
    }

    // Delete auth user
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(adminId)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      // Don't fail the entire operation if auth user deletion fails
      // The admin_users record is already deleted
      console.warn(`Auth user deletion failed for admin ${adminId}, but admin_users record was deleted`)
    }

    return NextResponse.json({
      success: true,
      message: `Admin "${admin.full_name}" has been successfully deleted`
    })
  } catch (error) {
    console.error('Error deleting admin:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
