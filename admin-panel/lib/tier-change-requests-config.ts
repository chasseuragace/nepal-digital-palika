/**
 * Tier Change Requests Configuration & Dependency Injection Setup
 * Allows switching between Fake and Supabase datasources
 * Set via NEXT_PUBLIC_USE_FAKE_DATASOURCES environment variable
 */

import { ITierChangeRequestsDatasource } from './tier-change-requests-datasource'
import { FakeTierChangeRequestsDatasource } from './fake-tier-change-requests-datasource'
import { SupabaseTierChangeRequestsDatasource } from './supabase-tier-change-requests-datasource'

/**
 * Factory function for datasource
 */
export function createTierChangeRequestsDatasource(): ITierChangeRequestsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  console.log(
    `[TierChangeRequests] Using ${useFake ? 'FAKE' : 'SUPABASE'} datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=${useFake})`
  )

  if (useFake) {
    return new FakeTierChangeRequestsDatasource()
  }

  return new SupabaseTierChangeRequestsDatasource()
}

/**
 * Global singleton (lazy-initialized)
 */
let tierChangeRequestsDatasource: ITierChangeRequestsDatasource | null = null

export function getTierChangeRequestsDatasource(): ITierChangeRequestsDatasource {
  if (!tierChangeRequestsDatasource) {
    tierChangeRequestsDatasource = createTierChangeRequestsDatasource()
  }
  return tierChangeRequestsDatasource
}

/**
 * For testing: allow manual override
 */
export function setTierChangeRequestsDatasource(ds: ITierChangeRequestsDatasource) {
  tierChangeRequestsDatasource = ds
}
