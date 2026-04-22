/**
 * SOS Requests DI Configuration
 */

import { ISOSRequestsDatasource } from './sos-requests-datasource'
import { SupabaseSOSRequestsDatasource } from './supabase-sos-requests-datasource'
import { FakeSOSRequestsDatasource } from './fake-sos-requests-datasource'
let datasourceInstance: ISOSRequestsDatasource | null = null

export function createSOSRequestsDatasource(): ISOSRequestsDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[SOSRequests] Using FAKE datasource')
    return new FakeSOSRequestsDatasource()
  }
  const { supabaseClient } = require('./supabase')
  console.log('[SOSRequests] Using SUPABASE datasource')
  return new SupabaseSOSRequestsDatasource(supabaseClient)
}

export function getSOSRequestsDatasource(): ISOSRequestsDatasource {
  if (!datasourceInstance) datasourceInstance = createSOSRequestsDatasource()
  return datasourceInstance
}

export function setSOSRequestsDatasource(datasource: ISOSRequestsDatasource) {
  datasourceInstance = datasource
}
