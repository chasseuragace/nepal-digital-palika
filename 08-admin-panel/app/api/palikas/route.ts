import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: palikas, error } = await supabaseAdmin
      .from('palikas')
      .select('id, name_en, name_ne')
      .order('name_english')

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch palikas' }, { status: 500 })
    }

    return NextResponse.json(palikas)
  } catch (error) {
    console.error('Error fetching palikas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}