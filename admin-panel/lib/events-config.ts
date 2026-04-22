/**
 * Events DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { IEventsDatasource } from './events-datasource'
import { SupabaseEventsDatasource } from './supabase-events-datasource'
import { FakeEventsDatasource } from './fake-events-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IEventsDatasource | null = null

/**
 * Factory function - creates the appropriate datasource based on environment
 */
export function createEventsDatasource(): IEventsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[Events] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeEventsDatasource()
  }

  console.log('[Events] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseEventsDatasource(supabaseClient as any)
}

/**
 * Get or create singleton instance
 * Used by services to inject datasource
 */
export function getEventsDatasource(): IEventsDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createEventsDatasource()
  }
  return datasourceInstance
}

/**
 * Override datasource (for testing)
 * Usage: setEventsDatasource(new FakeEventsDatasource())
 */
export function setEventsDatasource(datasource: IEventsDatasource) {
  datasourceInstance = datasource
}
