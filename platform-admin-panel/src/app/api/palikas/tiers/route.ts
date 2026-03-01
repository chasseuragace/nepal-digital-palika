/**
 * GET /api/palikas/tiers
 * Fetch all palikas with their current subscription tier information
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface QueryParams {
  tier?: string
  province_id?: string
  search?: string
  page?: string
  limit?: string
}

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const tier = searchParams.get('tier') || undefined
    const provinceId = searchParams.get('province_id') || undefined
    const search = searchParams.get('search') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build query
    let query = supabase
      .from('palikas')
      .select(
        `
        *,
        subscription_tier:subscription_tier_id(*)
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (tier) {
      query = query.eq('subscription_tier.name', tier)
    }

    if (provinceId) {
      query = query.in(
        'district_id',
        supabase
          .from('districts')
          .select('id')
          .eq('province_id', parseInt(provinceId, 10))
      )
    }

    if (search) {
      query = query.or(
        `name_en.ilike.%${search}%,name_ne.ilike.%${search}%,code.ilike.%${search}%`
      )
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching palikas with tiers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch palikas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/palikas/tiers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
