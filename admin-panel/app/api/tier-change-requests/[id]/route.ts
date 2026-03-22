import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id

    // Get the tier change request
    const { data: tierRequest, error: fetchError } = await supabaseAdmin
      .from('tier_change_requests')
      .select('*')
      .eq('id', requestId)
      .single()

    if (fetchError || !tierRequest) {
      return NextResponse.json(
        { error: 'Tier change request not found' },
        { status: 404 }
      )
    }

    // Only pending requests can be deleted
    if (tierRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending requests can be deleted' },
        { status: 400 }
      )
    }

    // Delete the request
    const { error: deleteError } = await supabaseAdmin
      .from('tier_change_requests')
      .delete()
      .eq('id', requestId)

    if (deleteError) {
      console.error('Error deleting tier request:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete tier request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tier change request deleted'
    })
  } catch (error) {
    console.error('Error in DELETE /api/tier-change-requests/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
