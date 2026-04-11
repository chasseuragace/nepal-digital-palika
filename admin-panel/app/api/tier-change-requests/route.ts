import { NextRequest, NextResponse } from 'next/server'
import { TiersService } from '@/services/tiers.service'
import { getTierChangeRequestsDatasource } from '@/lib/tier-change-requests-config'

const tiersService = new TiersService(getTierChangeRequestsDatasource())

export async function POST(request: NextRequest) {
  try {
    const palikaIdHeader = request.headers.get('X-Palika-ID')
    const userIdHeader = request.headers.get('X-User-ID')
    const palikaId = palikaIdHeader ? parseInt(palikaIdHeader, 10) : null
    const userId = userIdHeader

    if (!palikaId || !userId) {
      return NextResponse.json(
        { error: 'X-Palika-ID and X-User-ID headers are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { requested_tier_id, reason } = body

    if (!requested_tier_id) {
      return NextResponse.json(
        { error: 'requested_tier_id is required' },
        { status: 400 }
      )
    }

    // Create tier change request
    const newRequest = await tiersService.createTierChangeRequest(
      palikaId,
      userId,
      requested_tier_id,
      reason
    )

    return NextResponse.json({
      success: true,
      request: newRequest
    })
  } catch (error) {
    console.error('Error in POST /api/tier-change-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    const tierData = await tiersService.getTierData(palikaId)

    return NextResponse.json({
      requests: tierData.tierChangeRequests || []
    })
  } catch (error) {
    console.error('Error in GET /api/tier-change-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
