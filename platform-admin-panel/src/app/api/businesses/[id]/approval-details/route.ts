/**
 * GET /api/businesses/[id]/approval-details
 * Get full business details for staff review
 */

import { NextRequest, NextResponse } from 'next/server'
import { BusinessesService } from '@/services/businesses.service'

const service = new BusinessesService()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await service.getApprovalDetails(id)
    if (!result.success) {
      const status = result.error === 'Business not found' ? 404 : 500
      return NextResponse.json({ error: result.error }, { status })
    }
    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Error in GET /api/businesses/[id]/approval-details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
