import { ITiersDatasource } from './tiers-datasource'
import { FakeTiersDatasource } from './fake-tiers-datasource'

let instance: ITiersDatasource | null = null

export function createTiersDatasource(): ITiersDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Tiers] Using FAKE datasource')
    return new FakeTiersDatasource()
  }
  console.log('[Tiers] Using SUPABASE datasource')
  const { SupabaseTiersDatasource } = require('./supabase-tiers-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabaseTiersDatasource(supabaseServer)
}

export function getTiersDatasource(): ITiersDatasource {
  if (!instance) instance = createTiersDatasource()
  return instance
}

export function setTiersDatasource(ds: ITiersDatasource) {
  instance = ds
}
