/**
 * Tier Validation DI Configuration
 */

import { ITierValidationDatasource } from './tier-validation-datasource'
import { SupabaseTierValidationDatasource } from './supabase-tier-validation-datasource'
import { FakeTierValidationDatasource } from './fake-tier-validation-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: ITierValidationDatasource | null = null

export function createTierValidationDatasource(): ITierValidationDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[TierValidation] Using FAKE datasource')
    return new FakeTierValidationDatasource()
  }
  console.log('[TierValidation] Using SUPABASE datasource')
  return new SupabaseTierValidationDatasource(supabaseClient)
}

export function getTierValidationDatasource(): ITierValidationDatasource {
  if (!datasourceInstance) datasourceInstance = createTierValidationDatasource()
  return datasourceInstance
}

export function setTierValidationDatasource(datasource: ITierValidationDatasource) {
  datasourceInstance = datasource
}
