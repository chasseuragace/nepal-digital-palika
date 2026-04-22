/**
 * Abstract Palika Profile Datasource
 * Defines contract for querying/storing palika profile data
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

export interface PalikaProfile {
  id: string | null
  palika_id: number
  description_en: string
  description_ne: string
  featured_image: string
  gallery_images: string[]
  highlights: Array<{ title: string; description: string; image_url?: string }>
  tourism_info: {
    best_time_to_visit?: string
    accessibility?: string
    languages?: string[]
    currency?: string
    image_url?: string
  }
  demographics: {
    population?: number
    area_sq_km?: number
    established_year?: number
  }
  videos: string[]
  created_at?: string
  updated_at?: string
}

export interface PalikaContactInfo {
  office_phone?: string
  office_email?: string
  website?: string
  total_wards?: number
}

export interface IPalikaProfileDatasource {
  /**
   * Get palika profile by ID
   */
  getByPalikaId(palikaId: number): Promise<PalikaProfile | null>

  /**
   * Update palika profile
   */
  update(palikaId: number, data: Partial<PalikaProfile>): Promise<PalikaProfile>

  /**
   * Create or update palika profile
   */
  upsert(palikaId: number, data: Partial<PalikaProfile>): Promise<PalikaProfile>

  /**
   * Get palika contact info (from palikas table)
   */
  getPalikaContactInfo(palikaId: number): Promise<PalikaContactInfo | null>

  /**
   * Update palika contact info (in palikas table)
   */
  updatePalikaContactInfo(palikaId: number, data: Partial<PalikaContactInfo>): Promise<void>

  /**
   * Sync gallery images from assets table to palika_profiles.gallery_images
   */
  syncGalleryImages(palikaId: number): Promise<string[] | null>
}
