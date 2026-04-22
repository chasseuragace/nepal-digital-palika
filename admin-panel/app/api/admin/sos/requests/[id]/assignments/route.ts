import { NextRequest, NextResponse } from 'next/server'
import { getSOSService } from '@/services/sos.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = getSOSService()
    const result = await service.getAssignmentsForRequest(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ data: result.data })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { provider_id, assignment_notes, estimated_arrival_minutes, adminId } = body

    if (!provider_id) {
      return NextResponse.json(
        { error: 'provider_id is required' },
        { status: 400 }
      )
    }

    const service = getSOSService()
    const result = await service.createAssignment(params.id, {
      provider_id: provider_id,
      assignment_notes: assignment_notes,
      estimated_arrival_minutes: estimated_arrival_minutes,
    }, adminId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
