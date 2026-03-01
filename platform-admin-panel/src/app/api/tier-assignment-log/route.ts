/**
 * GET /api/tier-assignment-log
 * Fetch audit log of all tier assignment changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const palikaId = searchParams.get('palika_id') || undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    // Build query
    let query = supabase
      .from('tier_assignment_log')
      .select(
        `
        *,
        palika:palika_id(*),
        old_tier:old_tier_id(*),
        new_tier:new_tier_id(*),
        assigned_by:assigned_by(full_name, email)
      `,
        { count: 'exact' }
      )

    // Apply filters
    if (palikaId) {
      query = query.eq('palika_id', parseInt(palikaId, 10))
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching tier assignment log:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tier assignment log' },
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
    console.error('Unexpected error in GET /api/tier-assignment-log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
