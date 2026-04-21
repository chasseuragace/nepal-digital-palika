/**
 * POST /api/businesses/register
 * Create new business registration (citizen self-service)
 * Tier-gated: Only available if palika has 'self_service_registration' feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { BusinessesService } from '@/services/businesses.service'

const service = new BusinessesService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await service.register(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 500 }
      )
    }

    return NextResponse.json(
      { success: true, data: result.data },
      { status: result.status ?? 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/businesses/register:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
