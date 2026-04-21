import { SupabaseClient } from '@supabase/supabase-js'
import { DashboardStats, IStatsDatasource, AdminByRole } from './stats-datasource'

export class SupabaseStatsDatasource implements IStatsDatasource {
  constructor(private client: SupabaseClient) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const c = this.client

    const { count: totalAdmins } = await c
      .from('admin_users')
      .select('*', { count: 'exact', head: true })

    const { data: roles } = await c.from('roles').select('*')

    const { count: permissionsCount } = await c
      .from('permissions')
      .select('*', { count: 'exact', head: true })

    const { count: provincesCount } = await c
      .from('provinces')
      .select('*', { count: 'exact', head: true })

    const { count: districtsCount } = await c
      .from('districts')
      .select('*', { count: 'exact', head: true })

    const { count: palikasCount } = await c
      .from('palikas')
      .select('*', { count: 'exact', head: true })

    const totalRegions =
      (provincesCount || 0) + (districtsCount || 0) + (palikasCount || 0)

    const { data: adminsByRole } = await c.from('admin_users').select('role')

    const adminsByRoleGrouped: AdminByRole[] =
      adminsByRole?.reduce((acc: AdminByRole[], admin: any) => {
        const existing = acc.find((item) => item.role === admin.role)
        if (existing) existing.count++
        else acc.push({ role: admin.role, count: 1 })
        return acc
      }, []) || []

    const { data: recentActivity } = await c
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    return {
      total_admins: totalAdmins || 0,
      active_roles: roles?.length || 0,
      permissions: permissionsCount || 0,
      regions: totalRegions,
      admins_by_role: adminsByRoleGrouped,
      recent_activity: (recentActivity as any) || [],
    }
  }
}
