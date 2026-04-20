import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCallerFromRequest } from '@/lib/server/session'

export async function GET(request: NextRequest) {
  try {
    // Scope: palika_admin sees only their palika; super_admin sees all.
    // Content team and unauthenticated callers are rejected.
    const caller = await getCallerFromRequest(request)
    if (!caller || !caller.is_active) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (caller.role_name !== 'super_admin' && caller.role_name !== 'palika_admin') {
      return NextResponse.json(
        { error: 'Only palika_admin or super_admin can list admins' },
        { status: 403 }
      )
    }
    if (caller.role_name === 'palika_admin' && caller.palika_id == null) {
      return NextResponse.json(
        { error: 'palika_admin has no palika_id assigned' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const roleFilter = searchParams.get('role_filter') || ''
    const hierarchyLevelFilter = searchParams.get('hierarchy_level_filter') || ''

    // Validate pagination parameters
    const validPage = Math.max(1, page)
    const validLimit = Math.min(Math.max(1, limit), 100) // Cap at 100 per page

    // Build the query - we need to get email from auth.users via the id foreign key
    // Since Supabase doesn't support cross-schema joins in the client, we'll fetch admin_users
    // and then get emails separately or use a different approach
    let query = supabaseAdmin
      .from('admin_users')
      .select(`
        id,
        full_name,
        role,
        hierarchy_level,
        province_id,
        district_id,
        palika_id,
        is_active,
        created_at,
        updated_at,
        admin_regions(
          id,
          region_type,
          region_id,
          assigned_at
        )
      `, { count: 'exact' })

    // Apply filters
    if (search) {
      query = query.ilike('full_name', `%${search}%`)
    }

    if (roleFilter) {
      query = query.eq('role', roleFilter)
    }

    if (hierarchyLevelFilter) {
      query = query.eq('hierarchy_level', hierarchyLevelFilter)
    }

    // Caller-scope filter: palika_admin sees only their palika's admins.
    if (caller.role_name === 'palika_admin') {
      query = query.eq('palika_id', caller.palika_id)
    }

    // Apply pagination
    const offset = (validPage - 1) * validLimit
    query = query.range(offset, offset + validLimit - 1)

    // Order by created_at descending
    query = query.order('created_at', { ascending: false })

    // Execute query
    const { data: admins, error, count } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch admins' },
        { status: 500 }
      )
    }

    // Format the response with region information
    const formattedAdmins = admins.map(admin => {
      // Get region names from admin_regions
      const regions = admin.admin_regions || []
      
      return {
        id: admin.id,
        full_name: admin.full_name,
        role: admin.role,
        hierarchy_level: admin.hierarchy_level,
        province_id: admin.province_id,
        district_id: admin.district_id,
        palika_id: admin.palika_id,
        is_active: admin.is_active,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
        regions: regions.map(r => ({
          id: r.id,
          region_type: r.region_type,
          region_id: r.region_id,
          assigned_at: r.assigned_at
        }))
      }
    })

    return NextResponse.json({
      data: formattedAdmins,
      total: count || 0,
      page: validPage,
      limit: validLimit
    })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
