import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const actionFilter = searchParams.get('action_filter') || ''
    const entityTypeFilter = searchParams.get('entity_type_filter') || ''
    const adminIdFilter = searchParams.get('admin_id_filter') || ''
    const dateFrom = searchParams.get('date_from') || ''
    const dateTo = searchParams.get('date_to') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('audit_log')
      .select('id, admin_id, action, entity_type, entity_id, changes, created_at, admin_users(full_name)', { count: 'exact' })

    // Apply filters
    if (actionFilter) {
      query = query.eq('action', actionFilter)
    }

    if (entityTypeFilter) {
      query = query.eq('entity_type', entityTypeFilter)
    }

    if (adminIdFilter) {
      query = query.eq('admin_id', adminIdFilter)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    if (search) {
      query = query.or(`entity_id.ilike.%${search}%,entity_type.ilike.%${search}%`)
    }

    // Get total count
    const { count: total, error: countError } = await query

    if (countError) {
      console.error('Supabase count error:', countError)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    // Get paginated data
    const { data: logs, error } = await supabaseAdmin
      .from('audit_log')
      .select('id, admin_id, action, entity_type, entity_id, changes, created_at, admin_users(full_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    return NextResponse.json({
      data: logs || [],
      total: total || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching audit log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
