import { NextRequest, NextResponse } from 'next/server'
import { TierValidationService } from '@/services/tier-validation.service'

export async function GET(request: NextRequest) {
  try {
    const palikaId = request.nextUrl.searchParams.get('palika_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    // Service's default constructor wires the configured ITierValidationDatasource
    // (fake / supabase) via getTierValidationDatasource().
    const tierValidationService = new TierValidationService()

    const result = await tierValidationService.getPalikaTierInfo(parseInt(palikaId))

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/tier-info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
