// Admin User Types
export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'super_admin' | 'province_admin' | 'district_admin' | 'palika_admin' | 'moderator' | 'support_agent'
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  province_id?: number
  district_id?: number
  palika_id?: number
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

// Role Types
export interface Role {
  id: number
  name: string
  description: string
  description_ne?: string
  created_at: string
}

// Permission Types
export interface Permission {
  id: number
  name: string
  description: string
  description_ne?: string
  resource: string
  action: string
  created_at: string
}

// Geographic Types
export interface Province {
  id: number
  name_en: string
  name_ne: string
  code: string
  created_at: string
}

export interface District {
  id: number
  province_id: number
  name_en: string
  name_ne: string
  code: string
  created_at: string
}

export interface Palika {
  id: number
  district_id: number
  name_en: string
  name_ne: string
  type: 'municipality' | 'metropolitan' | 'sub_metropolitan'
  code: string
  total_wards: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Admin Region Types
export interface AdminRegion {
  id: number
  admin_id: string
  region_type: 'province' | 'district' | 'palika'
  region_id: number
  assigned_at: string
  assigned_by?: string
}

// Audit Log Types
export interface AuditLog {
  id: number
  admin_id: string
  action: string
  entity_type: string
  entity_id?: string
  changes?: Record<string, any>
  created_at: string
}

// Dashboard Stats
export interface DashboardStats {
  total_admins: number
  active_admins: number
  total_roles: number
  total_permissions: number
  total_provinces: number
  total_districts: number
  total_palikas: number
  pending_approvals: number
}
