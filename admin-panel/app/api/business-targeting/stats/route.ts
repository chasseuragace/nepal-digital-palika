import { NextRequest, NextResponse } from 'next/server'
import { businessTargetingService } from '@/services/business-targeting.service'

/**
 * GET /api/business-targeting/stats
 * Get targeting statistics for the palika.
 * Uses clean architecture with dependency-injected datasource.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const palikaId = parseInt(searchParams.get('palika_id') || '1', 10)

    const stats = await businessTargetingService.getTargetingStats(palikaId)
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Failed to get targeting stats:', error)
    return NextResponse.json(
      { error: 'Failed to get targeting stats' },
      { status: 500 }
    )
  }
}
