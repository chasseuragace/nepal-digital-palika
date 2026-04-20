import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getFakeProvinces } from '@/lib/fake-regions-datasource'

const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

export async function GET() {
  try {
    if (useFake) {
      return NextResponse.json({ data: getFakeProvinces() })
    }

    const { data: provinces, error } = await supabaseAdmin
      .from('provinces')
      .select('id, name_en, name_ne, code')
      .order('name_en')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
    }

    return NextResponse.json({ data: provinces })
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
