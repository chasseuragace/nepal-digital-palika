/**
 * Audit Log DI Configuration
 */

import { IAuditLogDatasource } from './audit-log-datasource'
import { SupabaseAuditLogDatasource } from './supabase-audit-log-datasource'
import { FakeAuditLogDatasource } from './fake-audit-log-datasource'
import { supabaseAdmin } from './supabase'

let datasourceInstance: IAuditLogDatasource | null = null

export function createAuditLogDatasource(): IAuditLogDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[AuditLog] Using FAKE datasource')
    return new FakeAuditLogDatasource()
  }
  console.log('[AuditLog] Using SUPABASE datasource')
  return new SupabaseAuditLogDatasource(supabaseAdmin as any)
}

export function getAuditLogDatasource(): IAuditLogDatasource {
  if (!datasourceInstance) datasourceInstance = createAuditLogDatasource()
  return datasourceInstance
}

export function setAuditLogDatasource(datasource: IAuditLogDatasource) {
  datasourceInstance = datasource
}
