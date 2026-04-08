import { NextRequest, NextResponse } from 'next/server'
import { businessTargetingService } from '@/services/business-targeting.service'

/**
 * GET /api/business-targeting/users?business_ids=b1,b2,b3
 * Fetch users associated with selected businesses.
 * Used by notification composer to find users to target when businesses are selected.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessIdsStr = searchParams.get('business_ids') || ''

    if (!businessIdsStr.trim()) {
      return NextResponse.json({ data: [] })
    }

    const businessIds = businessIdsStr.split(',').map(id => id.trim())
    const users = await businessTargetingService.fetchUsersForBusinesses(businessIds)

    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('Failed to fetch users for businesses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
