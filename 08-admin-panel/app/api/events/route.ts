import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: events, error } = await supabaseAdmin
      .from('events')
      .select(`
        id,
        name_en,
        name_ne,
        event_type,
        start_date,
        end_date,
        status,
        created_at,
        palikas!inner(name_en)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const formattedEvents = events.map(event => ({
      id: event.id,
      name_english: event.name_en,
      name_nepali: event.name_ne,
      event_type: event.event_type,
      start_date: event.start_date,
      end_date: event.end_date,
      status: event.status,
      palika_name: event.palikas?.name_en || 'Unknown',
      created_at: event.created_at
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}