/**
 * Palika Profile Configuration & Dependency Injection Setup
 * Allows switching between Fake and Supabase datasources
 * Set via NEXT_PUBLIC_USE_FAKE_DATASOURCES environment variable
 */

import { IPalikaProfileDatasource } from './palika-profile-datasource'
import { FakePalikaProfileDatasource } from './fake-palika-profile-datasource'
import { SupabasePalikaProfileDatasource } from './supabase-palika-profile-datasource'

/**
 * Factory function for datasource
 */
export function createPalikaProfileDatasource(): IPalikaProfileDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  console.log(
    `[PalikaProfile] Using ${useFake ? 'FAKE' : 'SUPABASE'} datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=${useFake})`
  )

  if (useFake) {
    return new FakePalikaProfileDatasource()
  }

  return new SupabasePalikaProfileDatasource()
}

/**
 * Global singleton (lazy-initialized)
 */
let palikaProfileDatasource: IPalikaProfileDatasource | null = null

export function getPalikaProfileDatasource(): IPalikaProfileDatasource {
  if (!palikaProfileDatasource) {
    palikaProfileDatasource = createPalikaProfileDatasource()
  }
  return palikaProfileDatasource
}

/**
 * For testing: allow manual override
 */
export function setPalikaProfileDatasource(ds: IPalikaProfileDatasource) {
  palikaProfileDatasource = ds
}
