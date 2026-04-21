import { IPalikasDatasource } from './palikas-datasource'
import { FakePalikasDatasource } from './fake-palikas-datasource'

let instance: IPalikasDatasource | null = null

export function createPalikasDatasource(): IPalikasDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Palikas] Using FAKE datasource')
    return new FakePalikasDatasource()
  }
  console.log('[Palikas] Using SUPABASE datasource')
  const { SupabasePalikasDatasource } = require('./supabase-palikas-datasource')
  const { supabase } = require('../supabase')
  const { supabaseServer } = require('../supabase-server')
  // Use service-role client: palikas-datasource is consumed by both public
  // and subscriptions/* routes; the latter requires bypassing RLS. The
  // public /api/palikas/tiers route is an admin tool, so service role is safe.
  void supabase
  return new SupabasePalikasDatasource(supabaseServer)
}

export function getPalikasDatasource(): IPalikasDatasource {
  if (!instance) instance = createPalikasDatasource()
  return instance
}

export function setPalikasDatasource(ds: IPalikasDatasource) {
  instance = ds
}
