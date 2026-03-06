import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/subscriptions/palikas
 * Returns all palikas with their subscription tier
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
      .from('palikas')
      .select(`
        id,
        name_en,
        subscription_tier_id,
        subscription_tiers(id, name, display_name)
      `)
      .order('name_en', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch palikas'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/subscriptions/palikas/:id
 * Updates a palika's subscription tier
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { palikaId, tierId } = body

    if (!palikaId || !tierId) {
      return NextResponse.json(
        { error: 'Missing palikaId or tierId' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await serviceClient
      .from('palikas')
      .update({ subscription_tier_id: tierId })
      .eq('id', palikaId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update palika'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
