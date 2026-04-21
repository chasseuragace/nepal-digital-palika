import { ITierAssignmentLogDatasource } from './tier-assignment-log-datasource'
import { FakeTierAssignmentLogDatasource } from './fake-tier-assignment-log-datasource'

let instance: ITierAssignmentLogDatasource | null = null

export function createTierAssignmentLogDatasource(): ITierAssignmentLogDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[TierAssignmentLog] Using FAKE datasource')
    return new FakeTierAssignmentLogDatasource()
  }
  // Lazy-load supabase impl so fake mode works without Supabase env vars.
  console.log('[TierAssignmentLog] Using SUPABASE datasource')
  const {
    SupabaseTierAssignmentLogDatasource,
  } = require('./supabase-tier-assignment-log-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabaseTierAssignmentLogDatasource(supabaseServer)
}

export function getTierAssignmentLogDatasource(): ITierAssignmentLogDatasource {
  if (!instance) instance = createTierAssignmentLogDatasource()
  return instance
}

export function setTierAssignmentLogDatasource(ds: ITierAssignmentLogDatasource) {
  instance = ds
}
