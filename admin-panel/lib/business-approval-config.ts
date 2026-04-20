/**
 * Business Approval DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { IBusinessApprovalDatasource } from './business-approval-datasource'
import { SupabaseBusinessApprovalDatasource } from './supabase-business-approval-datasource'
import { FakeBusinessApprovalDatasource } from './fake-business-approval-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IBusinessApprovalDatasource | null = null

/**
 * Factory function - creates the appropriate datasource based on environment
 */
export function createBusinessApprovalDatasource(): IBusinessApprovalDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[BusinessApproval] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeBusinessApprovalDatasource()
  }

  console.log('[BusinessApproval] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseBusinessApprovalDatasource(supabaseClient)
}

/**
 * Get or create singleton instance
 * Used by services to inject datasource
 */
export function getBusinessApprovalDatasource(): IBusinessApprovalDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createBusinessApprovalDatasource()
  }
  return datasourceInstance
}

/**
 * Override datasource (for testing)
 * Usage: setBusinessApprovalDatasource(new FakeBusinessApprovalDatasource())
 */
export function setBusinessApprovalDatasource(datasource: IBusinessApprovalDatasource) {
  datasourceInstance = datasource
}
