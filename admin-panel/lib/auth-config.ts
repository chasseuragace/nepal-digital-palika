/**
 * Auth DI Configuration
 */

import { IAuthDatasource } from './auth-datasource'
import { SupabaseAuthDatasource } from './supabase-auth-datasource'
import { FakeAuthDatasource } from './fake-auth-datasource'
import { supabaseClient } from './supabase'

let datasourceInstance: IAuthDatasource | null = null

export function createAuthDatasource(): IAuthDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Auth] Using FAKE datasource')
    return new FakeAuthDatasource()
  }
  console.log('[Auth] Using SUPABASE datasource')
  return new SupabaseAuthDatasource(supabaseClient as any)
}

export function getAuthDatasource(): IAuthDatasource {
  if (!datasourceInstance) datasourceInstance = createAuthDatasource()
  return datasourceInstance
}

export function setAuthDatasource(datasource: IAuthDatasource) {
  datasourceInstance = datasource
}
