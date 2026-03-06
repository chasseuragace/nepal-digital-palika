import { supabase } from './supabase'

export interface Admin {
  id: string
  email?: string
  full_name: string
  role: string
  palika_id?: number | null
  is_active?: boolean
  created_at: string
  palikas?: {
    id: number
    name_en: string
    district_id: number
    districts: {
      id: number
      name_en: string
      province_id: number
      provinces: {
        id: number
        name_en: string
      }
    }
  } | null
}

export interface Role {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface Permission {
  id: number
  name: string
  description?: string
  created_at: string
}

export interface Region {
  id: number
  name_en: string
  name_ne?: string
  type: 'province' | 'district' | 'palika'
  created_at: string
}

export interface AuditLog {
  id: number
  admin_id: string
  action: string
  entity_type: string
  entity_id?: string
  changes?: Record<string, any>
  created_at: string
}

export const apiClient = {
  // Admins
  getAdmins: async () => {
    const response = await fetch('/api/admins')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch admins')
    }
    const { data } = await response.json()
    return data as Admin[]
  },

  getAdmin: async (id: string) => {
    const response = await fetch(`/api/admins/${id}`)
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch admin')
    }
    const { data } = await response.json()
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

  getRole: async (id: number) => {
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

  updateRole: async (id: number, data: Partial<Role>) => {
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

  getRolePermissions: async (roleId: number) => {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId)
    
    if (error) throw error
    return data?.map((rp: any) => rp.permissions) as Permission[]
  },

  // Regions (Provinces, Districts, Palikas)
  getProvinces: async () => {
    const { data, error } = await supabase
      .from('provinces')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Region[]
  },

  getDistricts: async () => {
    const { data, error } = await supabase
      .from('districts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Region[]
  },

  getPalikas: async () => {
    const { data, error } = await supabase
      .from('palikas')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data as Region[]
  },

  getRegions: async () => {
    try {
      const [provinces, districts, palikas] = await Promise.all([
        apiClient.getProvinces(),
        apiClient.getDistricts(),
        apiClient.getPalikas(),
      ])
      
      return [
        ...provinces.map(p => ({ ...p, type: 'province' as const })),
        ...districts.map(d => ({ ...d, type: 'district' as const })),
        ...palikas.map(p => ({ ...p, type: 'palika' as const })),
      ]
    } catch (error) {
      console.error('Error fetching regions:', error)
      throw error
    }
  },

  getAdminsByRole: async (roleId: number) => {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('role', roleId)
    
    if (error) throw error
    return data as Admin[]
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
    try {
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
      
      // Get regions (provinces + districts + palikas)
      const { count: provincesCount } = await supabase
        .from('provinces')
        .select('*', { count: 'exact', head: true })
      
      const { count: districtsCount } = await supabase
        .from('districts')
        .select('*', { count: 'exact', head: true })
      
      const { count: palikasCount } = await supabase
        .from('palikas')
        .select('*', { count: 'exact', head: true })
      
      const totalRegions = (provincesCount || 0) + (districtsCount || 0) + (palikasCount || 0)
      
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
        regions: totalRegions,
        admins_by_role: adminsByRoleGrouped,
        recent_activity: recentActivity as AuditLog[],
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  },
}
