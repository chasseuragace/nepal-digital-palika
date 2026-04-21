import { IStatsDatasource } from './stats-datasource'
import { FakeStatsDatasource } from './fake-stats-datasource'

let instance: IStatsDatasource | null = null

export function createStatsDatasource(): IStatsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Stats] Using FAKE datasource')
    return new FakeStatsDatasource()
  }
  // Lazy-load supabase impl so fake mode works without Supabase env vars.
  console.log('[Stats] Using SUPABASE datasource')
  const { SupabaseStatsDatasource } = require('./supabase-stats-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabaseStatsDatasource(supabaseServer)
}

export function getStatsDatasource(): IStatsDatasource {
  if (!instance) instance = createStatsDatasource()
  return instance
}

export function setStatsDatasource(ds: IStatsDatasource) {
  instance = ds
}
