/**
 * Palika Profile Client Service
 * Abstracts palika profile API calls from UI components.
 *
 * The admin page edits two related records:
 *   - `palika_profiles` (JSONB content fields)
 *   - `palikas` (contact info fields: office_phone, office_email, website, total_wards)
 *
 * The API route merges both into a single logical "profile" payload so the UI only
 * has to deal with one request/response shape.
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

  // Contact info (sourced from `palikas` table, edited inline on this page)
  office_phone?: string
  office_email?: string
  website?: string
  total_wards?: number
}

export interface PalikaProfileResponse {
  profile: PalikaProfile
  /**
   * Optional warning (e.g. contact info save failed but content saved).
   * Present only on PUT responses when a partial failure occurred.
   */
  warning?: string
}

class PalikaProfileClientService {
  private baseUrl = '/api/palika-profile'

  /**
   * Get palika profile by ID
   */
  async getByPalikaId(palikaId: number): Promise<PalikaProfileResponse> {
    const response = await fetch(`${this.baseUrl}?palika_id=${palikaId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch palika profile')
    }

    return response.json()
  }

  /**
   * Update palika profile (and contact info on palikas table).
   */
  async update(
    palikaId: number,
    profile: Partial<Omit<PalikaProfile, 'id' | 'palika_id'>>
  ): Promise<PalikaProfileResponse> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Palika-ID': palikaId.toString() },
      body: JSON.stringify(profile)
    })

    if (!response.ok) {
      let message = 'Failed to update palika profile'
      try {
        const body = await response.json()
        if (body?.error) message = body.error
      } catch {
        /* ignore */
      }
      throw new Error(message)
    }

    return response.json()
  }
}

export const palikaProfileService = new PalikaProfileClientService()
