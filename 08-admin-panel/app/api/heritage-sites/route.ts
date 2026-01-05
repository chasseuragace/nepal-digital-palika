import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: sites, error } = await supabaseAdmin
      .from('heritage_sites')
      .select(`
        id,
        name_en,
        name_ne,
        site_type,
        heritage_status,
        status,
        created_at,
        palikas!inner(name_en)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch heritage sites' }, { status: 500 })
    }

    const formattedSites = sites.map(site => ({
      id: site.id,
      name_english: site.name_en,
      name_nepali: site.name_ne,
      category: site.site_type,
      type: site.heritage_status,
      status: site.status,
      palika_name: site.palikas?.name_en || 'Unknown',
      created_at: site.created_at
    }))

    return NextResponse.json(formattedSites)
  } catch (error) {
    console.error('Error fetching heritage sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json()

    // Generate UUID for the heritage site
    const id = crypto.randomUUID()

    const heritageData = {
      id,
      name_nepali: formData.name_nepali,
      name_english: formData.name_english,
      category: formData.category,
      type: formData.type,
      status: formData.status,
      address: formData.address,
      ward_number: formData.ward_number,
      palika_id: formData.palika_id,
      latitude: formData.latitude,
      longitude: formData.longitude,
      altitude: formData.altitude || null,
      short_description: formData.short_description,
      full_description: formData.full_description,
      opening_hours: formData.opening_hours || null,
      entry_fee: formData.entry_fee || null,
      best_time_to_visit: formData.best_time_to_visit || null,
      time_needed: formData.time_needed || null,
      accessibility: formData.accessibility || null,
      facilities: formData.facilities || null,
      restrictions: formData.restrictions || null,
      contact_info: formData.contact_info || null,
      meta_title: formData.meta_title || formData.name_english,
      meta_description: formData.meta_description || formData.short_description.substring(0, 150),
      keywords: formData.keywords || null,
      url_slug: formData.url_slug || formData.name_english.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from('heritage_sites')
      .insert([heritageData])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to create heritage site' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating heritage site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}