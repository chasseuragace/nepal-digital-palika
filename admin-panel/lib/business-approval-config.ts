/**
 * Business Approval DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { IBusinessApprovalDatasource } from './business-approval-datasource'
import { SupabaseBusinessApprovalDatasource } from './supabase-business-approval-datasource'
import { FakeBusinessApprovalDatasource } from './fake-business-approval-datasource'

// Business approval is a server-side admin workflow (verify, reject, update
// verification_status). RLS policies hide pending/rejected rows from the
// anon key, so using `supabaseClient` (anon) here meant verify/reject lookups
// returned zero rows and surfaced as "Business not found". Use the service-
// role key explicitly — same posture as platform-admin-panel.
function getServiceRoleClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      '[business-approval-config] SUPABASE_SERVICE_ROLE_KEY is required ' +
        'for the Supabase datasource (set NEXT_PUBLIC_USE_FAKE_DATASOURCES=true ' +
        'for offline development).'
    )
  }
  return createClient(url, key)
}

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
  return new SupabaseBusinessApprovalDatasource(getServiceRoleClient())
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
