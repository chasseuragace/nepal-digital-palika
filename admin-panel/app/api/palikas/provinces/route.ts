import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
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
