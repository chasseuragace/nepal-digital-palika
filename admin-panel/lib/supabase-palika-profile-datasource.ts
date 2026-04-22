/**
 * Supabase Palika Profile Datasource
 * Real implementation using Supabase database
 */

import { supabaseAdmin } from './supabase'
import { IPalikaProfileDatasource, PalikaProfile, PalikaContactInfo } from './palika-profile-datasource'

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

  /**
   * Get palika contact info (from palikas table)
   */
  async getPalikaContactInfo(palikaId: number): Promise<PalikaContactInfo | null> {
    const { data, error } = await supabaseAdmin
      .from('palikas')
      .select('office_phone, office_email, website, total_wards')
      .eq('id', palikaId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to fetch palika contact info: ${error.message}`)
    }

    return data as PalikaContactInfo
  }

  /**
   * Update palika contact info (in palikas table)
   */
  async updatePalikaContactInfo(palikaId: number, data: Partial<PalikaContactInfo>): Promise<void> {
    const { error } = await supabaseAdmin
      .from('palikas')
      .update(data)
      .eq('id', palikaId)

    if (error) {
      throw new Error(`Failed to update palika contact info: ${error.message}`)
    }
  }

  /**
   * Sync gallery images from assets table to palika_profiles.gallery_images
   */
  async syncGalleryImages(palikaId: number): Promise<string[] | null> {
    try {
      const { data: rows, error } = await supabaseAdmin
        .from('assets')
        .select('public_url, is_featured, sort_order, created_at')
        .eq('palika_id', palikaId)
        .eq('file_type', 'image')
        .order('is_featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        console.warn('[palika-profile] gallery sync fetch failed:', error.message)
        return null
      }

      const urls: string[] = (rows || [])
        .filter((r: any) => typeof r?.public_url === 'string' && r.public_url.length > 0)
        .map((r: any) => r.public_url)

      // Write the URL list into palika_profiles.gallery_images for this palika.
      const { error: updateError } = await supabaseAdmin
        .from('palika_profiles')
        .update({ gallery_images: urls })
        .eq('palika_id', palikaId)

      if (updateError) {
        console.warn('[palika-profile] gallery sync write failed:', updateError.message)
        return null
      }

      return urls
    } catch (err) {
      console.warn('[palika-profile] gallery sync unavailable:', err)
      return null
    }
  }
}
