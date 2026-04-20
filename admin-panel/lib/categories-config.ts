/**
 * Categories DI Configuration
 * Factory for creating appropriate datasource based on environment
 */

import { ICategoriesDatasource } from './categories-datasource'
import { SupabaseCategoriesDatasource } from './supabase-categories-datasource'
import { FakeCategoriesDatasource } from './fake-categories-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: ICategoriesDatasource | null = null

/**
 * Factory function - creates the appropriate datasource based on environment
 */
export function createCategoriesDatasource(): ICategoriesDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[Categories] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeCategoriesDatasource()
  }

  console.log('[Categories] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseCategoriesDatasource(supabaseClient)
}

/**
 * Get or create singleton instance
 * Used by services to inject datasource
 */
export function getCategoriesDatasource(): ICategoriesDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createCategoriesDatasource()
  }
  return datasourceInstance
}

/**
 * Override datasource (for testing)
 * Usage: setCategoriesDatasource(new FakeCategoriesDatasource())
 */
export function setCategoriesDatasource(datasource: ICategoriesDatasource) {
  datasourceInstance = datasource
}
