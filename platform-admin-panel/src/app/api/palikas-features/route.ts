/**
 * GET /api/palikas-features?palika_id=X
 * Returns all features enabled for the palika's subscription tier.
 */

import { NextRequest, NextResponse } from 'next/server'
import { PalikaFeaturesService } from '@/services/palika-features.service'

const service = new PalikaFeaturesService()

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const palikaId = searchParams.get('palika_id')

  if (!palikaId) {
    return NextResponse.json(
      { error: 'palika_id query parameter is required' },
      { status: 400 }
    )
  }

  const palikaIdNum = parseInt(palikaId, 10)
  const result = await service.getFeaturesForPalika(palikaIdNum)

  if (!result.success) {
    const status = result.error === 'Palika not found' ? 404 : 500
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ success: true, data: result.data })
}
