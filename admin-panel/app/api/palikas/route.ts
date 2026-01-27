import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const districtId = searchParams.get('district_id')

    let query = supabaseAdmin
      .from('palikas')
      .select('id, name_en, name_ne, code, district_id')

    if (districtId) {
      query = query.eq('district_id', Number(districtId))
    }

    const { data: palikas, error } = await query.order('name_en')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch palikas' }, { status: 500 })
    }

    return NextResponse.json({ data: palikas })
  } catch (error) {
    console.error('Error fetching palikas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}