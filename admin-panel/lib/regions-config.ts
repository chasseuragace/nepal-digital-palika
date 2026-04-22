/**
 * Regions DI Configuration
 */

import { IRegionsDatasource } from './regions-datasource'
import { SupabaseRegionsDatasource } from './supabase-regions-datasource'
import { FakeRegionsHierarchyDatasource } from './fake-regions-hierarchy-datasource'
import { supabaseAdmin } from './supabase'

let datasourceInstance: IRegionsDatasource | null = null

export function createRegionsDatasource(): IRegionsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Regions] Using FAKE datasource')
    return new FakeRegionsHierarchyDatasource()
  }
  console.log('[Regions] Using SUPABASE datasource')
  return new SupabaseRegionsDatasource(supabaseAdmin as any)
}

export function getRegionsDatasource(): IRegionsDatasource {
  if (!datasourceInstance) datasourceInstance = createRegionsDatasource()
  return datasourceInstance
}

export function setRegionsDatasource(datasource: IRegionsDatasource) {
  datasourceInstance = datasource
}
