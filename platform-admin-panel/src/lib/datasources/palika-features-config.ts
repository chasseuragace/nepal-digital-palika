import { IPalikaFeaturesDatasource } from './palika-features-datasource'
import { FakePalikaFeaturesDatasource } from './fake-palika-features-datasource'

let instance: IPalikaFeaturesDatasource | null = null

export function createPalikaFeaturesDatasource(): IPalikaFeaturesDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[PalikaFeatures] Using FAKE datasource')
    return new FakePalikaFeaturesDatasource()
  }
  // Lazy-load supabase impl so fake mode works without Supabase env vars.
  console.log('[PalikaFeatures] Using SUPABASE datasource')
  const { SupabasePalikaFeaturesDatasource } = require('./supabase-palika-features-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabasePalikaFeaturesDatasource(supabaseServer)
}

export function getPalikaFeaturesDatasource(): IPalikaFeaturesDatasource {
  if (!instance) instance = createPalikaFeaturesDatasource()
  return instance
}

export function setPalikaFeaturesDatasource(ds: IPalikaFeaturesDatasource) {
  instance = ds
}
