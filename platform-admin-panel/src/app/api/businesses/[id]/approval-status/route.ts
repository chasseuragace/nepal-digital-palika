/**
 * PUT /api/businesses/[id]/approval-status
 * Update business approval status (approve/reject/request changes)
 */

import { NextRequest, NextResponse } from 'next/server'
import { BusinessesService } from '@/services/businesses.service'

const service = new BusinessesService()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = (await request.json()) as {
      status: 'approved' | 'rejected' | 'request_changes'
      reason?: string
    }

    const result = await service.updateApprovalStatus(id, {
      status: body.status,
      reason: body.reason,
      reviewerId: (request.headers.get('x-user-id') as string) || null,
    })

    if (!result.success || !result.data) {
      const status =
        result.error === 'Business not found'
          ? 404
          : result.error?.startsWith('Invalid status')
            ? 400
            : 500
      return NextResponse.json({ error: result.error }, { status })
    }

    const label =
      body.status === 'approved'
        ? 'approved and published'
        : body.status === 'rejected'
          ? 'rejected'
          : 'marked for changes'

    return NextResponse.json({
      success: true,
      data: {
        business_id: id,
        verification_status: result.data.verification_status,
        status: result.data.status,
        is_published: result.data.is_published,
        message: `Business ${label}`,
      },
    })
  } catch (error) {
    console.error('Error in PUT /api/businesses/[id]/approval-status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
