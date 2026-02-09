import { supabase } from './supabase'

export interface Admin {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  region_id?: string
  created_at: string
  updated_at: string
}

export interface Role {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Permission {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface Region {
  id: string
  name: string
  type: string
  parent_id?: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  changes?: Record<string, any>
  created_at: string
}

export const apiClient = {
  // Admins
  getAdmins: async () => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Admin[]
  },

  getAdmin: async (id: string) => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Admin
  },

  createAdmin: async (data: Partial<Admin>) => {
    const { data: result, error } = await supabase
      .from('admin_users')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return result as Admin
  },

  updateAdmin: async (id: string, data: Partial<Admin>) => {
    const { data: result, error } = await supabase
      .from('admin_users')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result as Admin
  },

  deleteAdmin: async (id: string) => {
    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Roles
  getRoles: async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Role[]
  },

  getRole: async (id: string) => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Role
  },

  createRole: async (data: Partial<Role>) => {
    const { data: result, error } = await supabase
      .from('roles')
      .insert([data])
      .select()
      .single()
    
    if (error) throw error
    return result as Role
  },

  updateRole: async (id: string, data: Partial<Role>) => {
    const { data: result, error } = await supabase
      .from('roles')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return result as Role
  },

  // Permissions
  getPermissions: async () => {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Permission[]
  },

  getRolePermissions: async (roleId: string) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId)
    
    if (error) throw error
    return data?.map((rp: any) => rp.permissions) as Permission[]
  },

  // Regions
  getRegions: async () => {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Region[]
  },

  assignAdminToRegion: async (adminId: string, regionId: string) => {
    const { error } = await supabase
      .from('admin_regions')
      .insert([{ admin_id: adminId, region_id: regionId }])
    
    if (error) throw error
  },

  removeAdminFromRegion: async (adminId: string, regionId: string) => {
    const { error } = await supabase
      .from('admin_regions')
      .delete()
      .eq('admin_id', adminId)
      .eq('region_id', regionId)
    
    if (error) throw error
  },

  // Audit Log
  getAuditLog: async (limit?: number) => {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (limit) {
      query = query.limit(limit)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    return data as AuditLog[]
  },

  // Dashboard Stats
  getDashboardStats: async () => {
    // Get total admins
    const { count: totalAdmins } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
    
    // Get active roles
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
    
    // Get permissions
    const { count: permissionsCount } = await supabase
      .from('permissions')
      .select('*', { count: 'exact', head: true })
    
    // Get regions
    const { count: regionsCount } = await supabase
      .from('regions')
      .select('*', { count: 'exact', head: true })
    
    // Get admins by role
    const { data: adminsByRole } = await supabase
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
    const { data: recentActivity } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)

    return {
      total_admins: totalAdmins || 0,
      active_roles: roles?.length || 0,
      permissions: permissionsCount || 0,
      regions: regionsCount || 0,
      admins_by_role: adminsByRoleGrouped,
      recent_activity: recentActivity as AuditLog[],
    }
  },
}
