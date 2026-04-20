/**
 * Marketplace Analytics DI Configuration
 * Factory for creating the appropriate datasource based on environment.
 * Matches the clean-arch pattern used by heritage-sites-config, events-config,
 * and blog-posts-config.
 */

import { FakeMarketplaceAnalyticsDatasource } from './fake-marketplace-analytics-datasource'
import { IMarketplaceAnalyticsDatasource } from './marketplace-analytics-datasource'
import { SupabaseMarketplaceAnalyticsDatasource } from './supabase-marketplace-analytics-datasource'
import { supabaseAdmin } from './supabase'

let datasourceInstance: IMarketplaceAnalyticsDatasource | null = null

/**
 * Factory — creates fake datasource when NEXT_PUBLIC_USE_FAKE_DATASOURCES=true,
 * otherwise binds to the service-role Supabase client for analytics reads.
 */
export function createMarketplaceAnalyticsDatasource(): IMarketplaceAnalyticsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[MarketplaceAnalytics] Using FAKE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=true)')
    return new FakeMarketplaceAnalyticsDatasource()
  }

  console.log('[MarketplaceAnalytics] Using SUPABASE datasource (NEXT_PUBLIC_USE_FAKE_DATASOURCES=false)')
  return new SupabaseMarketplaceAnalyticsDatasource(supabaseAdmin)
}

/**
 * Singleton accessor — reuses the same datasource across route invocations
 * within a single server runtime.
 */
export function getMarketplaceAnalyticsDatasource(): IMarketplaceAnalyticsDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createMarketplaceAnalyticsDatasource()
  }
  return datasourceInstance
}

/**
 * Test seam — override the datasource (e.g. inject a fake in a unit test).
 */
export function setMarketplaceAnalyticsDatasource(datasource: IMarketplaceAnalyticsDatasource) {
  datasourceInstance = datasource
}
