import { NextRequest, NextResponse } from 'next/server'
import { getSOSService } from '@/services/sos.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const body = await request.json()
    const { status, actual_arrival_at, completion_notes } = body

    const service = getSOSService()
    const result = await service.updateAssignmentStatus(params.assignmentId, { status })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const service = getSOSService()
    const result = await service.cancelAssignment(params.assignmentId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling assignment:', error)
    return NextResponse.json(
      { error: 'Failed to cancel assignment' },
      { status: 500 }
    )
  }
}
