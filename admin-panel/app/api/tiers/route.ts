import { NextRequest, NextResponse } from 'next/server'
import { TiersService } from '@/services/tiers.service'
import { getTierChangeRequestsDatasource } from '@/lib/tier-change-requests-config'

const tiersService = new TiersService(getTierChangeRequestsDatasource())

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
      tiers: tierData.tiers,
      currentSubscription: tierData.currentSubscription || null,
      tierChangeRequests: tierData.tierChangeRequests || []
    })
  } catch (error) {
    console.error('Error in GET /api/tiers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
