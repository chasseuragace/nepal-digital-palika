import { IAdminsDatasource } from './admins-datasource'
import { FakeAdminsDatasource } from './fake-admins-datasource'

let instance: IAdminsDatasource | null = null

export function createAdminsDatasource(): IAdminsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Admins] Using FAKE datasource')
    return new FakeAdminsDatasource()
  }
  // Lazy-load supabase impl so fake mode works without Supabase env vars.
  console.log('[Admins] Using SUPABASE datasource')
  const { SupabaseAdminsDatasource } = require('./supabase-admins-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabaseAdminsDatasource(supabaseServer)
}

export function getAdminsDatasource(): IAdminsDatasource {
  if (!instance) instance = createAdminsDatasource()
  return instance
}

export function setAdminsDatasource(ds: IAdminsDatasource) {
  instance = ds
}
