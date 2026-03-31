import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const palikaId = params.get('palika_id')
    const serviceType = params.get('service_type')
    const status = params.get('status')
    const search = params.get('search')
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '25')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('service_providers')
      .select('*, palikas!inner(name_en)', { count: 'exact' })

    if (palikaId) query = query.eq('palika_id', palikaId)
    if (serviceType) query = query.eq('service_type', serviceType)
    if (status) query = query.eq('status', status)
    else query = query.eq('is_active', true)
    if (search) {
      query = query.or(`name_en.ilike.%${search}%,name_ne.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    query = query
      .order('service_type')
      .order('name_en')
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      meta: { page, limit, total: count || 0, hasMore: (data?.length || 0) === limit }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const providerData = {
      palika_id: body.palika_id,
      name_en: body.name_en,
      name_ne: body.name_ne,
      service_type: body.service_type,
      phone: body.phone,
      email: body.email,
      secondary_phones: body.secondary_phones || [],
      location: `POINT(${body.longitude} ${body.latitude})`,
      address: body.address,
      ward_number: body.ward_number,
      coverage_area: body.coverage_area,
      vehicle_count: body.vehicle_count || 1,
      services: body.services || [],
      is_24_7: body.is_24_7 ?? true,
      status: 'available',
      is_active: true,
      created_by: body.admin_id,
    }

    const { data, error } = await supabaseAdmin
      .from('service_providers')
      .insert(providerData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
