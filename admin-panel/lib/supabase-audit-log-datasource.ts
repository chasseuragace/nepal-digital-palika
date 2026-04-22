/**
 * Supabase Audit Log Datasource
 */

import { IAuditLogDatasource, AuditLogFilters, PaginationResult } from './audit-log-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseAuditLogDatasource implements IAuditLogDatasource {
  constructor(private db: SupabaseClient) {}

  async getAuditLogs(filters: AuditLogFilters): Promise<PaginationResult> {
    const page = filters.page || 1
    const limit = filters.limit || 20
    const search = filters.search || ''
    const actionFilter = filters.action_filter || ''
    const entityTypeFilter = filters.entity_type_filter || ''
    const adminIdFilter = filters.admin_id_filter || ''
    const dateFrom = filters.date_from || ''
    const dateTo = filters.date_to || ''

    const offset = (page - 1) * limit

    // Build query
    let query = this.db
      .from('audit_log')
      .select('id, admin_id, action, entity_type, entity_id, changes, created_at, admin_users(full_name)', { count: 'exact' })

    // Apply filters
    if (actionFilter) {
      query = query.eq('action', actionFilter)
    }

    if (entityTypeFilter) {
      query = query.eq('entity_type', entityTypeFilter)
    }

    if (adminIdFilter) {
      query = query.eq('admin_id', adminIdFilter)
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    if (search) {
      query = query.or(`entity_id.ilike.%${search}%,entity_type.ilike.%${search}%`)
    }

    // Get total count
    const { count: total, error: countError } = await query

    if (countError) {
      console.error('Supabase count error:', countError)
      throw new Error('Failed to fetch audit log')
    }

    // Get paginated data
    const { data: logs, error } = await this.db
      .from('audit_log')
      .select('id, admin_id, action, entity_type, entity_id, changes, created_at, admin_users(full_name)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Supabase error:', error)
      throw new Error('Failed to fetch audit log')
    }

    return {
      data: logs || [],
      total: total || 0,
      page,
      limit
    }
  }
}
