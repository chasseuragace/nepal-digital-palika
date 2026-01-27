import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const provinceId = searchParams.get('province_id')

    if (!provinceId) {
      return NextResponse.json({ error: 'province_id is required' }, { status: 400 })
    }

    const { data: districts, error } = await supabaseAdmin
      .from('districts')
      .select('id, name_en, name_ne, code, province_id')
      .eq('province_id', Number(provinceId))
      .order('name_en')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch districts' }, { status: 500 })
    }

    return NextResponse.json({ data: districts })
  } catch (error) {
    console.error('Error fetching districts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
