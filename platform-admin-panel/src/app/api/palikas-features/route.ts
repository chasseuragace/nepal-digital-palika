/**
 * GET /api/palikas-features?palika_id=X
 * Check which features are available for a Palika
 * Used by registration forms to enable/disable features
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const palikaId = searchParams.get('palika_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id query parameter is required' },
        { status: 400 }
      )
    }

    const palikaIdNum = parseInt(palikaId, 10)

    // Get Palika's tier and features
    const { data: palikaData, error: palikaError } = await supabase
      .from('palikas')
      .select('subscription_tier_id')
      .eq('id', palikaIdNum)
      .single()

    if (palikaError || !palikaData) {
      return NextResponse.json(
        { error: 'Palika not found' },
        { status: 404 }
      )
    }

    // If no tier assigned, return empty features (default to basic)
    if (!palikaData.subscription_tier_id) {
      return NextResponse.json({
        success: true,
        data: {
          palika_id: palikaIdNum,
          tier_id: null,
          features: [],
          feature_codes: [],
        },
      })
    }

    // Get all features enabled for this tier
    const { data: tierFeatures, error: featuresError } = await supabase
      .from('tier_features')
      .select('features(*)')
      .eq('tier_id', palikaData.subscription_tier_id)
      .eq('enabled', true)

    if (featuresError) {
      console.error('Error fetching tier features:', featuresError)
      return NextResponse.json(
        { error: 'Failed to fetch features' },
        { status: 500 }
      )
    }

    const features = tierFeatures?.map((tf: any) => tf.features) || []
    const featureCodes = features.map((f: any) => f.code)

    return NextResponse.json({
      success: true,
      data: {
        palika_id: palikaIdNum,
        tier_id: palikaData.subscription_tier_id,
        features,
        feature_codes: featureCodes,
      },
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/palikas-features:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
