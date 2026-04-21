import { IBusinessesDatasource } from './businesses-datasource'
import { FakeBusinessesDatasource } from './fake-businesses-datasource'

let instance: IBusinessesDatasource | null = null

export function createBusinessesDatasource(): IBusinessesDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Businesses] Using FAKE datasource')
    return new FakeBusinessesDatasource()
  }
  console.log('[Businesses] Using SUPABASE datasource')
  const {
    SupabaseBusinessesDatasource,
  } = require('./supabase-businesses-datasource')
  const { supabaseServer } = require('../supabase-server')
  return new SupabaseBusinessesDatasource(supabaseServer)
}

export function getBusinessesDatasource(): IBusinessesDatasource {
  if (!instance) instance = createBusinessesDatasource()
  return instance
}

export function setBusinessesDatasource(ds: IBusinessesDatasource) {
  instance = ds
}
