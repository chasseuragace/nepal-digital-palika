/**
 * Marketplace Products DI Configuration
 */

import { IMarketplaceProductsDatasource } from './marketplace-products-datasource'
import { SupabaseMarketplaceProductsDatasource } from './supabase-marketplace-products-datasource'
import { FakeMarketplaceProductsDatasource } from './fake-marketplace-products-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IMarketplaceProductsDatasource | null = null

export function createMarketplaceProductsDatasource(): IMarketplaceProductsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'

  if (useFake) {
    console.log('[MarketplaceProducts] Using FAKE datasource')
    return new FakeMarketplaceProductsDatasource()
  }

  console.log('[MarketplaceProducts] Using SUPABASE datasource')
  return new SupabaseMarketplaceProductsDatasource(supabaseClient)
}

export function getMarketplaceProductsDatasource(): IMarketplaceProductsDatasource {
  if (!datasourceInstance) {
    datasourceInstance = createMarketplaceProductsDatasource()
  }
  return datasourceInstance
}

export function setMarketplaceProductsDatasource(datasource: IMarketplaceProductsDatasource) {
  datasourceInstance = datasource
}
