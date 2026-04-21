import { AuditLog } from '@/lib/types'

export interface AdminByRole {
  role: string
  count: number
}

export interface DashboardStats {
  total_admins: number
  active_roles: number
  permissions: number
  regions: number
  admins_by_role: AdminByRole[]
  recent_activity: AuditLog[]
}

export interface IStatsDatasource {
  getDashboardStats(): Promise<DashboardStats>
}
