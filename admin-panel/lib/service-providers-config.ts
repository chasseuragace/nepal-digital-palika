/**
 * Service Providers DI Configuration
 */

import { IServiceProvidersDatasource } from './service-providers-datasource'
import { SupabaseServiceProvidersDatasource } from './supabase-service-providers-datasource'
import { FakeServiceProvidersDatasource } from './fake-service-providers-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IServiceProvidersDatasource | null = null

export function createServiceProvidersDatasource(): IServiceProvidersDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[ServiceProviders] Using FAKE datasource')
    return new FakeServiceProvidersDatasource()
  }
  console.log('[ServiceProviders] Using SUPABASE datasource')
  return new SupabaseServiceProvidersDatasource(supabaseClient as any)
}

export function getServiceProvidersDatasource(): IServiceProvidersDatasource {
  if (!datasourceInstance) datasourceInstance = createServiceProvidersDatasource()
  return datasourceInstance
}

export function setServiceProvidersDatasource(datasource: IServiceProvidersDatasource) {
  datasourceInstance = datasource
}
