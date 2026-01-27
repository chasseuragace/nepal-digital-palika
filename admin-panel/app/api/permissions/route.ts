import { NextResponse, NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const resource = searchParams.get('resource') || ''

    const offset = (page - 1) * limit

    // Build query
    let query = supabaseAdmin
      .from('permissions')
      .select('id, name, resource, action, description', { count: 'exact' })

    // Apply resource filter
    if (resource) {
      query = query.eq('resource', resource)
    }

    // Get total count
    const { count: total, error: countError } = await query

    if (countError) {
      console.error('Supabase count error:', countError)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    // Get paginated data
    const { data: permissions, error } = await supabaseAdmin
      .from('permissions')
      .select('id, name, resource, action, description')
      .order('resource')
      .order('action')
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch permissions' }, { status: 500 })
    }

    return NextResponse.json({
      data: permissions || [],
      total: total || 0,
      page,
      limit
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
