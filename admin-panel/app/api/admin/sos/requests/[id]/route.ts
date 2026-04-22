import { NextRequest, NextResponse } from 'next/server'
import { getSOSService } from '@/services/sos.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const service = getSOSService()
    const result = await service.getSOSRequestById(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching SOS request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SOS request' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, resolution_notes, adminId } = body

    const service = getSOSService()
    const result = await service.updateSOSRequestStatus(params.id, {
      status,
      resolution_notes,
    }, adminId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating SOS request:', error)
    return NextResponse.json(
      { error: 'Failed to update SOS request' },
      { status: 500 }
    )
  }
}
