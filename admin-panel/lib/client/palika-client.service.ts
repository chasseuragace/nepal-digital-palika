/**
 * Palika Client Service
 * Abstracts palika, province, and district API calls from UI components
 */

export interface Province {
  id: number
  name_en: string
  name_ne?: string
}

export interface District {
  id: number
  name_en: string
  name_ne?: string
  province_id: number
}

export interface Palika {
  id: number
  name_en: string
  name_ne?: string
  district_id: number
}

export interface PalikaHierarchyResponse {
  data: Palika[]
  total?: number
}

class PalikaClientService {
  private baseUrl = '/api/palikas'

  /**
   * Get all provinces
   */
  async getProvinces(): Promise<Province[]> {
    const response = await fetch(`${this.baseUrl}/provinces`)

    if (!response.ok) {
      throw new Error('Failed to fetch provinces')
    }

    const result = await response.json()
    return result.data || (Array.isArray(result) ? result : [])
  }

  /**
   * Get all districts, optionally filtered by province
   */
  async getDistricts(provinceId?: number): Promise<District[]> {
    const url = provinceId
      ? `${this.baseUrl}/districts?province_id=${provinceId}`
      : `${this.baseUrl}/districts`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch districts')
    }

    const result = await response.json()
    return result.data || (Array.isArray(result) ? result : [])
  }

  /**
   * Get all palikas, optionally filtered by district
   */
  async getPalikas(districtId?: number): Promise<Palika[]> {
    const url = districtId
      ? `${this.baseUrl}?district_id=${districtId}`
      : this.baseUrl

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error('Failed to fetch palikas')
    }

    const result = await response.json()
    return result.data || (Array.isArray(result) ? result : [])
  }

  /**
   * Get a single palika by ID
   */
  async getById(id: number): Promise<Palika> {
    const response = await fetch(`${this.baseUrl}/${id}`)

    if (!response.ok) {
      throw new Error('Failed to fetch palika')
    }

    return response.json()
  }
}

export const palikaService = new PalikaClientService()
