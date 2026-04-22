import { NextRequest, NextResponse } from 'next/server'
import { getTierChangeRequestsDatasource } from '@/lib/tier-change-requests-config'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id

    const datasource = getTierChangeRequestsDatasource()

    // Get the tier change request
    const tierRequest = await datasource.getRequestById(requestId)

    if (!tierRequest) {
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
    await datasource.deleteRequest(requestId)

    return NextResponse.json({
      success: true,
      message: 'Tier change request deleted'
    })
  } catch (error) {
    console.error('Error deleting tier request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
