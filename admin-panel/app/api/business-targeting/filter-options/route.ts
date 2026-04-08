import { NextRequest, NextResponse } from 'next/server'
import { businessTargetingService } from '@/services/business-targeting.service'

/**
 * GET /api/business-targeting/filter-options
 * Get available filter options for UI dropdowns.
 * Uses clean architecture with dependency-injected datasource.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const palikaId = parseInt(searchParams.get('palika_id') || '1', 10)

    const options = await businessTargetingService.getFilterOptions(palikaId)
    return NextResponse.json(options)
  } catch (error) {
    console.error('Failed to get filter options:', error)
    return NextResponse.json(
      { error: 'Failed to get filter options' },
      { status: 500 }
    )
  }
}
