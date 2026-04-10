/**
 * Palika Profile Client Service
 * Abstracts palika profile API calls from UI components
 */

export interface PalikaProfile {
  id: string
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
}

export interface PalikaProfileResponse {
  profile: PalikaProfile
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
   * Update palika profile
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
      throw new Error('Failed to update palika profile')
    }

    return response.json()
  }
}

export const palikaProfileService = new PalikaProfileClientService()
