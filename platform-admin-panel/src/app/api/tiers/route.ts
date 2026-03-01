/**
 * GET /api/tiers
 * Fetch all subscription tiers with feature counts
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Fetch all active tiers with feature counts
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select(
        `
        *,
        tier_features(count)
      `
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching tiers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subscription tiers' },
        { status: 500 }
      )
    }

    // Transform response to include feature count
    const tiersWithCounts = data?.map((tier: any) => ({
      ...tier,
      feature_count: tier.tier_features?.[0]?.count || 0,
    })) || []

    return NextResponse.json({
      success: true,
      data: tiersWithCounts,
      count: tiersWithCounts.length,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/tiers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
