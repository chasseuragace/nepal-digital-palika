import { NextRequest, NextResponse } from 'next/server'
import { businessTargetingService } from '@/services/business-targeting.service'

/**
 * GET /api/business-targeting
 * Query businesses for notification targeting with dynamic filtering.
 * Uses clean architecture with dependency-injected datasource.
 *
 * Query params:
 *   - palika_id: number (required)
 *   - wards: comma-separated ward numbers (e.g., "1,2,5")
 *   - business_types: comma-separated business_type_ids
 *   - min_rating: number (0-5)
 *   - min_view_count: number
 *   - min_product_count: number
 *   - search: string
 *   - page: number (default 1)
 *   - pageSize: number (default 20)
 *
 * Example:
 *   GET /api/business-targeting?palika_id=1&wards=1,2&min_rating=3.5&min_product_count=5&page=1
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const palikaId = parseInt(searchParams.get('palika_id') || '1', 10)

    // Parse filter parameters
    const filters = {
      ward_number: searchParams.get('wards')
        ? searchParams.get('wards')!.split(',').map(w => parseInt(w, 10))
        : undefined,

      business_type_id: searchParams.get('business_types')
        ? searchParams.get('business_types')!.split(',').map(t => parseInt(t, 10))
        : undefined,

      min_rating: searchParams.get('min_rating')
        ? parseFloat(searchParams.get('min_rating')!)
        : undefined,

      min_view_count: searchParams.get('min_view_count')
        ? parseInt(searchParams.get('min_view_count')!, 10)
        : undefined,

      min_product_count: searchParams.get('min_product_count')
        ? parseInt(searchParams.get('min_product_count')!, 10)
        : undefined,

      search: searchParams.get('search') || undefined,

      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '20', 10),
    }

    // Query businesses via service (uses DI'd datasource)
    const result = await businessTargetingService.queryBusinesses(palikaId, filters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Business targeting query failed:', error)
    return NextResponse.json(
      { error: 'Failed to query businesses' },
      { status: 500 }
    )
  }
}

