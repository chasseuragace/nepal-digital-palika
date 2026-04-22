/**
 * Abstract Audit Log Datasource
 */

export interface AdminUser {
  full_name: string
}

export interface AuditLogEntry {
  id: number
  admin_id: string
  action: string
  entity_type: string
  entity_id: string
  changes: any
  created_at: string
  admin_users?: AdminUser[]
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  search?: string
  action_filter?: string
  entity_type_filter?: string
  admin_id_filter?: string
  date_from?: string
  date_to?: string
}

export interface PaginationResult {
  data: AuditLogEntry[]
  total: number
  page: number
  limit: number
}

export interface IAuditLogDatasource {
  getAuditLogs(filters: AuditLogFilters): Promise<PaginationResult>
}
