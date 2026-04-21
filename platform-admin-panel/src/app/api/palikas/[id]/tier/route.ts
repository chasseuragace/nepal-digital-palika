/**
 * GET /api/palikas/[id]/tier
 * Get Palika's current tier with available upgrades
 *
 * PUT /api/palikas/[id]/tier
 * Upgrade/change Palika's subscription tier (super_admin only)
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface UpgradeTierRequest {
  new_tier_id: string
  reason?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15+ requires `params` to be awaited — reading it synchronously
    // yields `undefined` and the resulting `parseInt(undefined)` produces NaN,
    // which silently filters the Supabase query down to zero rows and surfaces
    // as a generic "Palika not found".
    const { id } = await params
    const palikaId = parseInt(id, 10)

    // Get Palika with current tier
    const { data: palikaData, error: palikaError } = await supabase
      .from('palikas')
      // Embed target is the table name (`subscription_tiers`) with an alias
      // for the response key. Using the FK column name as the embed hint
      // (`subscription_tier:subscription_tier_id(*)`) silently fails through
      // supabase-js and surfaces as `palikaError` → generic 404.
      .select('*, subscription_tier:subscription_tiers(*)')
      .eq('id', palikaId)
      .single()

    if (palikaError) {
      console.error(`Error fetching palika ${palikaId}:`, palikaError)
      return NextResponse.json(
        { error: 'Palika not found' },
        { status: 404 }
      )
    }

    // Get all tiers for upgrade comparison
    const { data: allTiers, error: tiersError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (tiersError) {
      console.error('Error fetching tiers:', tiersError)
      return NextResponse.json(
        { error: 'Failed to fetch tiers' },
        { status: 500 }
      )
    }

    // Get features for current tier
    let currentTierFeatures = []
    if (palikaData?.subscription_tier_id) {
      const { data: features, error: featuresError } = await supabase
        .from('tier_features')
        .select('features(*)')
        .eq('tier_id', palikaData.subscription_tier_id)
        .eq('enabled', true)

      if (!featuresError) {
        currentTierFeatures = features?.map((tf: any) => tf.features) || []
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        palika: palikaData,
        current_tier: palikaData.subscription_tier,
        current_tier_features: currentTierFeatures,
        available_tiers: allTiers,
      },
    })
  } catch (error) {
    console.error(`Error in GET /api/palikas/[id]/tier:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const palikaId = parseInt(id, 10)

    // TODO: Verify user is super_admin
    // const user = await getUserSession(request)
    // if (!user || user.role !== 'super_admin') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 403 }
    //   )
    // }

    const body: UpgradeTierRequest = await request.json()

    if (!body.new_tier_id) {
      return NextResponse.json(
        { error: 'new_tier_id is required' },
        { status: 400 }
      )
    }

    // Verify tier exists
    const { data: tierData, error: tierError } = await supabase
      .from('subscription_tiers')
      .select('*')
      .eq('id', body.new_tier_id)
      .single()

    if (tierError || !tierData) {
      return NextResponse.json(
        { error: 'Subscription tier not found' },
        { status: 404 }
      )
    }

    // Get current tier for audit log
    const { data: palikaData } = await supabase
      .from('palikas')
      .select('subscription_tier_id')
      .eq('id', palikaId)
      .single()

    // Update Palika tier
    // The tier_assignment_log entry will be created automatically via database trigger
    const { error: updateError } = await supabase
      .from('palikas')
      .update({
        subscription_tier_id: body.new_tier_id,
      })
      .eq('id', palikaId)

    if (updateError) {
      console.error(`Error updating palika ${palikaId} tier:`, updateError)
      return NextResponse.json(
        { error: 'Failed to update tier' },
        { status: 500 }
      )
    }

    // Get updated tier info
    const { data: updatedPalika } = await supabase
      .from('palikas')
      // Embed target is the table name (`subscription_tiers`) with an alias
      // for the response key. Using the FK column name as the embed hint
      // (`subscription_tier:subscription_tier_id(*)`) silently fails through
      // supabase-js and surfaces as `palikaError` → generic 404.
      .select('*, subscription_tier:subscription_tiers(*)')
      .eq('id', palikaId)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        palika: updatedPalika,
        old_tier_id: palikaData?.subscription_tier_id,
        new_tier_id: body.new_tier_id,
        message: `Palika ${palikaId} tier upgraded to ${tierData.display_name}`,
      },
    })
  } catch (error) {
    console.error(`Error in PUT /api/palikas/[id]/tier:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
