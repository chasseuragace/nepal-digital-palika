import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getFakeDistricts } from '@/lib/fake-regions-datasource'

const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const provinceIdParam = searchParams.get('province_id')

    if (!provinceIdParam) {
      return NextResponse.json({ error: 'province_id is required' }, { status: 400 })
    }

    const provinceId = Number(provinceIdParam)

    if (useFake) {
      return NextResponse.json({ data: getFakeDistricts(provinceId) })
    }

    const { data: districts, error } = await supabaseAdmin
      .from('districts')
      .select('id, name_en, name_ne, code, province_id')
      .eq('province_id', provinceId)
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
