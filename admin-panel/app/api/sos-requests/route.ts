import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const palikaId = params.get('palika_id')
    const status = params.get('status')
    const emergencyType = params.get('emergency_type')
    const serviceType = params.get('service_type')
    const priority = params.get('priority')
    const search = params.get('search')
    const dateFrom = params.get('date_from')
    const dateTo = params.get('date_to')
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '25')
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('sos_requests')
      .select('*, palikas!inner(name_en)', { count: 'exact' })

    if (palikaId) query = query.eq('palika_id', palikaId)
    if (status) query = query.eq('status', status)
    if (emergencyType) query = query.eq('emergency_type', emergencyType)
    if (serviceType) query = query.eq('service_type', serviceType)
    if (priority) query = query.eq('priority', priority)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)
    if (search) {
      query = query.or(
        `user_name.ilike.%${search}%,user_phone.ilike.%${search}%,request_code.ilike.%${search}%,details.ilike.%${search}%`
      )
    }

    query = query
      .order('created_at', { ascending: false })
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
