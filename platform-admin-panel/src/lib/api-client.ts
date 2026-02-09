const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export const apiClient = {
  // Admins
  getAdmins: () => fetchAPI<Admin[]>('/api/admins'),
  getAdmin: (id: string) => fetchAPI<Admin>(`/api/admins/${id}`),
  createAdmin: (data: Partial<Admin>) => fetchAPI<Admin>('/api/admins/create', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateAdmin: (id: string, data: Partial<Admin>) => fetchAPI<Admin>(`/api/admins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteAdmin: (id: string) => fetchAPI<void>(`/api/admins/${id}/delete`, {
    method: 'DELETE',
  }),

  // Roles
  getRoles: () => fetchAPI<Role[]>('/api/roles'),
  getRole: (id: string) => fetchAPI<Role>(`/api/roles/${id}`),
  createRole: (data: Partial<Role>) => fetchAPI<Role>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateRole: (id: string, data: Partial<Role>) => fetchAPI<Role>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Permissions
  getPermissions: () => fetchAPI<Permission[]>('/api/permissions'),
  getRolePermissions: (roleId: string) => fetchAPI<Permission[]>(`/api/roles/${roleId}/permissions`),

  // Regions
  getRegions: () => fetchAPI<Region[]>('/api/regions'),
  assignAdminToRegion: (adminId: string, regionId: string) => fetchAPI<void>('/api/regions/assign-admin', {
    method: 'POST',
    body: JSON.stringify({ admin_id: adminId, region_id: regionId }),
  }),
  removeAdminFromRegion: (adminId: string, regionId: string) => fetchAPI<void>('/api/regions/remove-admin', {
    method: 'POST',
    body: JSON.stringify({ admin_id: adminId, region_id: regionId }),
  }),

  // Audit Log
  getAuditLog: (limit?: number) => fetchAPI<AuditLog[]>(`/api/audit-log${limit ? `?limit=${limit}` : ''}`),

  // Dashboard Stats
  getDashboardStats: () => fetchAPI<{
    total_admins: number
    active_roles: number
    permissions: number
    regions: number
    admins_by_role: Array<{ role: string; count: number }>
    recent_activity: AuditLog[]
  }>('/api/dashboard/stats'),
}
