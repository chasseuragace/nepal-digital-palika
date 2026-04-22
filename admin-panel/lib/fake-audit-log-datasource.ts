/**
 * Fake Audit Log Datasource
 */

import { IAuditLogDatasource, AuditLogFilters, PaginationResult } from './audit-log-datasource'

export class FakeAuditLogDatasource implements IAuditLogDatasource {
  private logs = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    admin_id: 'admin-1',
    action: i % 3 === 0 ? 'CREATE' : i % 3 === 1 ? 'UPDATE' : 'DELETE',
    entity_type: i % 2 === 0 ? 'heritage_site' : 'event',
    entity_id: `entity-${i + 1}`,
    changes: { field: 'value' },
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    admin_users: [{ full_name: 'Admin User' }]
  }))

  async getAuditLogs(filters: AuditLogFilters): Promise<PaginationResult> {
    await this.delay(100)

    const page = filters.page || 1
    const limit = filters.limit || 20
    const search = filters.search || ''
    const actionFilter = filters.action_filter || ''
    const entityTypeFilter = filters.entity_type_filter || ''
    const adminIdFilter = filters.admin_id_filter || ''
    const dateFrom = filters.date_from || ''
    const dateTo = filters.date_to || ''

    let filteredLogs = [...this.logs]

    // Apply filters
    if (actionFilter) {
      filteredLogs = filteredLogs.filter(log => log.action === actionFilter)
    }

    if (entityTypeFilter) {
      filteredLogs = filteredLogs.filter(log => log.entity_type === entityTypeFilter)
    }

    if (adminIdFilter) {
      filteredLogs = filteredLogs.filter(log => log.admin_id === adminIdFilter)
    }

    if (dateFrom) {
      filteredLogs = filteredLogs.filter(log => log.created_at >= dateFrom)
    }

    if (dateTo) {
      filteredLogs = filteredLogs.filter(log => log.created_at <= dateTo)
    }

    if (search) {
      filteredLogs = filteredLogs.filter(
        log =>
          log.entity_id.toLowerCase().includes(search.toLowerCase()) ||
          log.entity_type.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Sort by created_at descending
    filteredLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Paginate
    const offset = (page - 1) * limit
    const paginatedLogs = filteredLogs.slice(offset, offset + limit)

    return {
      data: paginatedLogs,
      total: filteredLogs.length,
      page,
      limit
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
