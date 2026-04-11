/**
 * Supabase Palika Profile Datasource
 * Real implementation using Supabase database
 */

import { supabaseAdmin } from './supabase'
import { IPalikaProfileDatasource, PalikaProfile } from './palika-profile-datasource'

export class SupabasePalikaProfileDatasource implements IPalikaProfileDatasource {
  /**
   * Get palika profile by ID
   */
  async getByPalikaId(palikaId: number): Promise<PalikaProfile | null> {
    const { data: profile, error } = await supabaseAdmin
      .from('palika_profiles')
      .select('*')
      .eq('palika_id', palikaId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }

    return profile || null
  }

  /**
   * Update palika profile
   */
  async update(palikaId: number, data: Partial<PalikaProfile>): Promise<PalikaProfile> {
    const { data: updated, error } = await supabaseAdmin
      .from('palika_profiles')
      .update(data)
      .eq('palika_id', palikaId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`)
    }

    return updated as PalikaProfile
  }

  /**
   * Create or update palika profile
   */
  async upsert(palikaId: number, data: Partial<PalikaProfile>): Promise<PalikaProfile> {
    const { data: result, error } = await supabaseAdmin
      .from('palika_profiles')
      .upsert(
        {
          palika_id: palikaId,
          ...data
        },
        { onConflict: 'palika_id' }
      )
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to upsert profile: ${error.message}`)
    }

    return result as PalikaProfile
  }
}
