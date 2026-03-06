import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/stats
 * Returns dashboard statistics
 * Uses service role key to bypass RLS
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 }
      )
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get total admins
    const { count: totalAdmins } = await serviceClient
      .from('admin_users')
      .select('*', { count: 'exact', head: true })

    // Get active roles
    const { data: roles } = await serviceClient
      .from('roles')
      .select('*')

    // Get permissions
    const { count: permissionsCount } = await serviceClient
      .from('permissions')
      .select('*', { count: 'exact', head: true })

    // Get regions (provinces + districts + palikas)
    const { count: provincesCount } = await serviceClient
      .from('provinces')
      .select('*', { count: 'exact', head: true })

    const { count: districtsCount } = await serviceClient
      .from('districts')
      .select('*', { count: 'exact', head: true })

    const { count: palikasCount } = await serviceClient
      .from('palikas')
      .select('*', { count: 'exact', head: true })

    const totalRegions = (provincesCount || 0) + (districtsCount || 0) + (palikasCount || 0)

    // Get admins by role
    const { data: adminsByRole } = await serviceClient
      .from('admin_users')
      .select('role')

    const adminsByRoleGrouped = adminsByRole?.reduce((acc: any, admin: any) => {
      const existing = acc.find((item: any) => item.role === admin.role)
      if (existing) {
        existing.count++
      } else {
        acc.push({ role: admin.role, count: 1 })
      }
      return acc
    }, []) || []

    // Get recent activity
    const { data: recentActivity } = await serviceClient
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    return NextResponse.json(
      {
        data: {
          total_admins: totalAdmins || 0,
          active_roles: roles?.length || 0,
          permissions: permissionsCount || 0,
          regions: totalRegions,
          admins_by_role: adminsByRoleGrouped,
          recent_activity: recentActivity || [],
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch stats'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
