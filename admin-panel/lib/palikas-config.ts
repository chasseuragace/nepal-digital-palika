/**
 * Palikas DI Configuration
 */

import { IPalikasDatasource } from './palikas-datasource'
import { SupabasePalikasDatasource } from './supabase-palikas-datasource'
import { FakePalikasDatasource } from './fake-palikas-datasource'
import { supabaseAdmin } from './supabase'

let datasourceInstance: IPalikasDatasource | null = null

export function createPalikasDatasource(): IPalikasDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Palikas] Using FAKE datasource')
    return new FakePalikasDatasource()
  }
  console.log('[Palikas] Using SUPABASE datasource')
  return new SupabasePalikasDatasource(supabaseAdmin as any)
}

export function getPalikasDatasource(): IPalikasDatasource {
  if (!datasourceInstance) datasourceInstance = createPalikasDatasource()
  return datasourceInstance
}

export function setPalikasDatasource(datasource: IPalikasDatasource) {
  datasourceInstance = datasource
}
