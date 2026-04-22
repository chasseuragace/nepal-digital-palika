/**
 * Analytics DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { IAnalyticsDatasource } from './analytics-datasource'
import { SupabaseAnalyticsDatasource } from './supabase-analytics-datasource'
import { FakeAnalyticsDatasource } from './fake-analytics-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IAnalyticsDatasource | null = null

/**
 * Factory function - creates the appropriate datasource based on environment
 */
export function createAnalyticsDatasource(): IAnalyticsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[Analytics] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeAnalyticsDatasource()
  }

  console.log('[Analytics] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseAnalyticsDatasource(supabaseClient as any)
}

/**
 * Get or create singleton instance
 * Used by services to inject datasource
 */
export function getAnalyticsDatasource(): IAnalyticsDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createAnalyticsDatasource()
  }
  return datasourceInstance
}

/**
 * Override datasource (for testing)
 * Usage: setAnalyticsDatasource(new FakeAnalyticsDatasource())
 */
export function setAnalyticsDatasource(datasource: IAnalyticsDatasource) {
  datasourceInstance = datasource
}
