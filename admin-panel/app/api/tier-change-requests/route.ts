import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const palikaIdHeader = request.headers.get('X-Palika-ID')
    const userIdHeader = request.headers.get('X-User-ID')
    const palikaId = palikaIdHeader ? parseInt(palikaIdHeader, 10) : null
    const userId = userIdHeader

    if (!palikaId || !userId) {
      return NextResponse.json(
        { error: 'X-Palika-ID and X-User-ID headers are required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { requested_tier_id, reason } = body

    if (!requested_tier_id) {
      return NextResponse.json(
        { error: 'requested_tier_id is required' },
        { status: 400 }
      )
    }

    // Get current tier
    const { data: palika, error: palikaError } = await supabaseAdmin
      .from('palikas')
      .select('subscription_tier_id')
      .eq('id', palikaId)
      .single()

    if (palikaError || !palika) {
      return NextResponse.json(
        { error: 'Palika not found' },
        { status: 404 }
      )
    }

    // Check if there's already a pending request
    const { data: existingRequest } = await supabaseAdmin
      .from('tier_change_requests')
      .select('id')
      .eq('palika_id', palikaId)
      .eq('status', 'pending')
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending tier change request already exists' },
        { status: 400 }
      )
    }

    // Create tier change request
    const { data: newRequest, error: createError } = await supabaseAdmin
      .from('tier_change_requests')
      .insert({
        palika_id: palikaId,
        current_tier_id: palika.subscription_tier_id,
        requested_tier_id,
        reason: reason || null,
        status: 'pending',
        requested_by: userId
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating tier change request:', createError)
      return NextResponse.json(
        { error: 'Failed to create tier change request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      request: newRequest
    })
  } catch (error) {
    console.error('Error in POST /api/tier-change-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const statusParam = request.nextUrl.searchParams.get('status')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    let query = supabaseAdmin
      .from('tier_change_requests')
      .select(`
        id,
        palika_id,
        current_tier_id,
        requested_tier_id,
        reason,
        status,
        requested_at,
        reviewed_at,
        review_notes,
        effective_date,
        subscription_tiers!tier_change_requests_current_tier_id_fkey(id, name, display_name),
        requested_tier:subscription_tiers!tier_change_requests_requested_tier_id_fkey(id, name, display_name)
      `)
      .eq('palika_id', palikaId)

    if (statusParam) {
      query = query.eq('status', statusParam)
    }

    const { data: requests, error } = await query.order('requested_at', { ascending: false })

    if (error) {
      console.error('Error fetching tier change requests:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tier change requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      requests: requests || []
    })
  } catch (error) {
    console.error('Error in GET /api/tier-change-requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
