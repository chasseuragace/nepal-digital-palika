import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/subscriptions/tiers
 * Returns all subscription tiers with features
 * Uses service role key to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await serviceClient
      .from('subscription_tiers')
      .select(`
        id,
        name,
        display_name,
        cost_per_year,
        tier_features(
          feature_id,
          features(id, code, display_name, category)
        )
      `)
      .order('cost_per_year', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tiers'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
