import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseClient } from '@/services/database-client'
import { MarketplaceAnalyticsService } from '@/services/marketplace-analytics.service'

export async function GET(request: NextRequest) {
  try {
    const palikaId = request.nextUrl.searchParams.get('palika_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    const db = createSupabaseClient(supabaseAdmin)
    const analyticsService = new MarketplaceAnalyticsService(db)

    const result = await analyticsService.getProductAnalytics(parseInt(palikaId))

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/analytics/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
