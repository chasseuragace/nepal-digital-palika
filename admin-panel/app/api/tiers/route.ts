import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    // Fetch all available tiers
    const { data: tiers, error: tiersError } = await supabaseAdmin
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('cost_per_month', { ascending: true })

    if (tiersError) {
      console.error('Error fetching tiers:', tiersError)
      return NextResponse.json(
        { error: 'Failed to fetch tiers' },
        { status: 500 }
      )
    }

    // Fetch current palika subscription info
    const { data: palika, error: palikaError } = await supabaseAdmin
      .from('palikas')
      .select(`
        id,
        name_en,
        subscription_tier_id,
        subscription_start_date,
        subscription_end_date,
        cost_per_month,
        subscription_tiers(id, name, display_name, description, cost_per_month, cost_per_year)
      `)
      .eq('id', palikaId)
      .single()

    if (palikaError && palikaError.code !== 'PGRST116') {
      console.error('Error fetching palika:', palikaError)
      return NextResponse.json(
        { error: 'Failed to fetch palika info' },
        { status: 500 }
      )
    }

    // Fetch pending tier change requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('tier_change_requests')
      .select(`
        id,
        current_tier_id,
        requested_tier_id,
        reason,
        status,
        requested_at,
        reviewed_at,
        review_notes,
        subscription_tiers!tier_change_requests_requested_tier_id_fkey(id, name, display_name)
      `)
      .eq('palika_id', palikaId)
      .order('requested_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching tier requests:', requestsError)
      return NextResponse.json(
        { error: 'Failed to fetch tier requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tiers,
      currentSubscription: palika || null,
      tierChangeRequests: requests || []
    })
  } catch (error) {
    console.error('Error in GET /api/tiers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
