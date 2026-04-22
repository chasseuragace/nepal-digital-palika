/**
 * Heritage Sites DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { IHeritageSitesDatasource } from './heritage-sites-datasource'
import { SupabaseHeritageSitesDatasource } from './supabase-heritage-sites-datasource'
import { FakeHeritageSitesDatasource } from './fake-heritage-sites-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IHeritageSitesDatasource | null = null

/**
 * Factory function - creates the appropriate datasource based on environment
 */
export function createHeritageSitesDatasource(): IHeritageSitesDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[HeritageSites] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeHeritageSitesDatasource()
  }

  console.log('[HeritageSites] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseHeritageSitesDatasource(supabaseClient as any)
}

/**
 * Get or create singleton instance
 * Used by services to inject datasource
 */
export function getHeritageSitesDatasource(): IHeritageSitesDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createHeritageSitesDatasource()
  }
  return datasourceInstance
}

/**
 * Override datasource (for testing)
 * Usage: setHeritageSitesDatasource(new FakeHeritageSitesDatasource())
 */
export function setHeritageSitesDatasource(datasource: IHeritageSitesDatasource) {
  datasourceInstance = datasource
}
