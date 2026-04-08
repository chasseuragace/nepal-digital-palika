/**
 * Business Targeting Configuration & DI Setup
 * Allows switching between Fake and Supabase datasources
 * Set via USE_FAKE_DATASOURCES environment variable
 */

import { IBusinessTargetingDatasource } from './business-targeting-datasource'
import { FakeBusinessTargetingDatasource } from './fake-business-targeting'
import { SupabaseBusinessTargetingDatasource } from './supabase-business-targeting-datasource'

// Factory function for datasource
export function createBusinessTargetingDatasource(): IBusinessTargetingDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  console.log(
    `[BusinessTargeting] Using ${useFake ? 'FAKE' : 'SUPABASE'} datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=${useFake})`
  )

  if (useFake) {
    return new FakeBusinessTargetingDatasource()
  }

  return new SupabaseBusinessTargetingDatasource()
}

// Global singleton (lazy-initialized)
let businessTargetingDatasource: IBusinessTargetingDatasource | null = null

export function getBusinessTargetingDatasource(): IBusinessTargetingDatasource {
  if (!businessTargetingDatasource) {
    businessTargetingDatasource = createBusinessTargetingDatasource()
  }
  return businessTargetingDatasource
}

// For testing: allow manual override
export function setBusinessTargetingDatasource(ds: IBusinessTargetingDatasource) {
  businessTargetingDatasource = ds
}
