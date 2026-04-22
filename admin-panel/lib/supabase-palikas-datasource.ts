/**
 * Supabase Palikas Datasource
 */

import { IPalikasDatasource, Province, District, Palika } from './palikas-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabasePalikasDatasource implements IPalikasDatasource {
  constructor(private db: SupabaseClient) {}

  async getProvinces(): Promise<Province[]> {
    const { data: provinces, error } = await this.db
      .from('provinces')
      .select('id, name_en, name_ne, code')
      .order('name_en')

    if (error) {
      console.error('Supabase error fetching provinces:', error)
      throw new Error('Failed to fetch provinces')
    }

    return provinces || []
  }

  async getDistricts(provinceId?: number): Promise<District[]> {
    let query = this.db
      .from('districts')
      .select('id, name_en, name_ne, code, province_id')

    if (provinceId !== undefined) {
      query = query.eq('province_id', provinceId)
    }

    const { data: districts, error } = await query.order('name_en')

    if (error) {
      console.error('Supabase error fetching districts:', error)
      throw new Error('Failed to fetch districts')
    }

    return districts || []
  }

  async getPalikas(districtId?: number): Promise<Palika[]> {
    let query = this.db
      .from('palikas')
      .select(`
        id,
        name_en,
        name_ne,
        code,
        district_id,
        center_point
      `)

    if (districtId !== undefined) {
      query = query.eq('district_id', districtId)
    }

    const { data: palikas, error } = await query.order('name_en')

    if (error) {
      console.error('Supabase error fetching palikas:', error)
      throw new Error('Failed to fetch palikas')
    }

    // Convert PostGIS center_point to lat/lng format
    const formattedPalikas = palikas?.map(palika => ({
      ...palika,
      center_point: palika.center_point
        ? {
            latitude: (palika.center_point as any).coordinates[1], // PostGIS returns [lng, lat]
            longitude: (palika.center_point as any).coordinates[0]
          }
        : null
    })) || []

    return formattedPalikas
  }

  async getPalikaById(id: number): Promise<Palika | null> {
    const { data: palika, error } = await this.db
      .from('palikas')
      .select(`
        id,
        name_en,
        name_ne,
        code,
        district_id,
        center_point
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error fetching palika:', error)
      throw new Error('Failed to fetch palika')
    }

    if (!palika) {
      return null
    }

    // Convert PostGIS center_point to lat/lng format
    const formattedPalika = {
      ...palika,
      center_point: palika.center_point
        ? {
            latitude: (palika.center_point as any).coordinates[1], // PostGIS returns [lng, lat]
            longitude: (palika.center_point as any).coordinates[0]
          }
        : null
    }

    return formattedPalika
  }
}
