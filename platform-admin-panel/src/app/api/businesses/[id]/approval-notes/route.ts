/**
 * Approval notes endpoints for a business.
 * POST adds an internal note, GET lists internal notes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { BusinessesService } from '@/services/businesses.service'

const service = new BusinessesService()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      content?: string
      is_internal?: boolean
    }

    const result = await service.addNote(id, {
      content: body.content ?? '',
      is_internal: body.is_internal !== false,
      author_id: (request.headers.get('x-user-id') as string) || null,
    })

    if (!result.success) {
      const status =
        result.error === 'Business not found'
          ? 404
          : result.error === 'Note content is required' ||
              result.error === 'Note content cannot exceed 5000 characters'
            ? 400
            : 500
      return NextResponse.json({ error: result.error }, { status })
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/businesses/[id]/approval-notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await service.getNotes(id)
    if (!result.success) {
      const status = result.error === 'Business not found' ? 404 : 500
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in GET /api/businesses/[id]/approval-notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
