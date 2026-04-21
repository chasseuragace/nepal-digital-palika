/**
 * GET /api/businesses/approvals
 * List pending businesses for palika staff verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { BusinessesService } from '@/services/businesses.service'

const service = new BusinessesService()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const palikaId = searchParams.get('palika_id')
      ? parseInt(searchParams.get('palika_id')!, 10)
      : undefined
    const status = (searchParams.get('status') as any) || undefined
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    const result = await service.getApprovals(
      {
        palika_id: palikaId,
        status,
        category,
        search,
        start_date: startDate,
        end_date: endDate,
      },
      { page, limit }
    )

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch pending approvals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data.data || [],
      total: result.data.count || 0,
      page,
      limit,
      pages: Math.ceil((result.data.count || 0) / limit),
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/businesses/approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
