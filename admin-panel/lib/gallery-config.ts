/**
 * Gallery DI Configuration
 */

import { IGalleryDatasource } from './gallery-datasource'
import { SupabaseGalleryDatasource } from './supabase-gallery-datasource'
import { FakeGalleryDatasource } from './fake-gallery-datasource'
import { supabaseAdmin } from './supabase'

let datasourceInstance: IGalleryDatasource | null = null

export function createGalleryDatasource(): IGalleryDatasource {
  const useFake = process.env.NEXT_PUBLIC_USE_FAKE_DATASOURCES === 'true'
  if (useFake) {
    console.log('[Gallery] Using FAKE datasource')
    return new FakeGalleryDatasource()
  }
  console.log('[Gallery] Using SUPABASE datasource')
  return new SupabaseGalleryDatasource(supabaseAdmin as any)
}

export function getGalleryDatasource(): IGalleryDatasource {
  if (!datasourceInstance) datasourceInstance = createGalleryDatasource()
  return datasourceInstance
}

export function setGalleryDatasource(datasource: IGalleryDatasource) {
  datasourceInstance = datasource
}
