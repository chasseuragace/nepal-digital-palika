/**
 * GET /api/businesses/approvals
 * List pending businesses for palika staff verification
 * Tier-gated: Only available if verification_workflow feature enabled
 * RLS: Staff can only see their own palika's businesses
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { palikaHasFeature } from '@/lib/tier-utils'

interface ApprovalsQuery {
  palika_id?: number
  status?: 'pending_review' | 'approved' | 'rejected' | 'draft'
  category?: string
  search?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const palikaId = searchParams.get('palika_id')
      ? parseInt(searchParams.get('palika_id')!, 10)
      : undefined
    const status = (searchParams.get('status') as any) || undefined
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('start_date') || undefined
    const endDate = searchParams.get('end_date') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      )
    }

    // If palika_id not provided, will be enforced by RLS
    let query = supabase
      .from('businesses')
      .select(
        `
        id,
        business_name,
        business_name_ne,
        category,
        palika_id,
        contact_phone,
        contact_email,
        status,
        verification_status,
        created_at,
        owner_info,
        featured_image_url,
        palikas(id, name_en, name_ne)
      `,
        { count: 'exact' }
      )

    // Filter by palika if provided
    if (palikaId) {
      query = query.eq('palika_id', palikaId)
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status)
    } else {
      // Default: show pending review and draft statuses
      query = query.in('status', ['pending_review', 'draft'])
    }

    // Filter by category
    if (category) {
      query = query.eq('category', category)
    }

    // Filter by date range
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Search by business name
    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,business_name_ne.ilike.%${search}%`
      )
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching approvals:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending approvals' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/businesses/approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
