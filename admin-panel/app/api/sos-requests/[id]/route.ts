import { NextRequest, NextResponse } from 'next/server'
import { getSOSService } from '@/services/sos.service'

const service = getSOSService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await service.getSOSRequestById(params.id)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'SOS request not found' }, { status: 404 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching SOS request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const updateData: any = {}

    // Status transition
    if (body.status) {
      updateData.status = body.status

      if (body.status === 'reviewing' && body.admin_id) {
        updateData.reviewed_by = body.admin_id
      }
      if (body.status === 'assigned' && body.admin_id) {
        updateData.assigned_to = body.admin_id
      }
      if (body.status === 'resolved' && body.resolution_notes) {
        updateData.resolution_notes = body.resolution_notes
      }
    }

    // Optional field updates
    if (body.priority) updateData.priority = body.priority
    if (body.urgency_score !== undefined) updateData.urgency_score = body.urgency_score
    if (body.service_type) updateData.service_type = body.service_type

    const result = await service.updateSOSRequestStatus(params.id, updateData, body.admin_id)

    if (!result.success || !result.data) {
      return NextResponse.json({ error: result.error || 'Failed to update SOS request' }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating SOS request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
