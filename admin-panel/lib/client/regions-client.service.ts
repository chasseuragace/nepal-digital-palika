/**
 * Regions Client Service
 * Abstracts regions (provinces, districts, palikas) and admin region assignment API calls
 */

export interface Province {
  id: number
  name_en: string
  name_ne: string
}

export interface District {
  id: number
  name_en: string
  name_ne: string
  province_id: number
}

export interface Palika {
  id: number
  name_en: string
  name_ne: string
  district_id: number
}

export interface AdminRegion {
  id: number
  admin_id: string
  region_type: 'province' | 'district' | 'palika'
  region_id: number
  assigned_at: string
}

export interface RegionsData {
  provinces: Province[]
  districts: District[]
  palikas: Palika[]
  adminRegions: AdminRegion[]
}

class RegionsClientService {
  private baseUrl = '/api/regions'

  /**
   * Fetch all regions (provinces, districts, palikas)
   */
  async getAll(): Promise<RegionsData> {
    const response = await fetch(this.baseUrl)

    if (!response.ok) {
      throw new Error('Failed to fetch regions')
    }

    return response.json()
  }

  /**
   * Get provinces only
   */
  async getProvinces(): Promise<Province[]> {
    const data = await this.getAll()
    return data.provinces
  }

  /**
   * Get districts only
   */
  async getDistricts(): Promise<District[]> {
    const data = await this.getAll()
    return data.districts
  }

  /**
   * Get palikas only
   */
  async getPalikas(): Promise<Palika[]> {
    const data = await this.getAll()
    return data.palikas
  }

  /**
   * Get districts for a specific province
   */
  async getDistrictsByProvince(provinceId: number): Promise<District[]> {
    const data = await this.getAll()
    return data.districts.filter(d => d.province_id === provinceId)
  }

  /**
   * Get palikas for a specific district
   */
  async getPalikasByDistrict(districtId: number): Promise<Palika[]> {
    const data = await this.getAll()
    return data.palikas.filter(p => p.district_id === districtId)
  }

  /**
   * Assign an admin to a region
   */
  async assignAdmin(
    adminId: string,
    regionType: 'province' | 'district' | 'palika',
    regionId: number
  ): Promise<{ success: boolean; data?: AdminRegion; error?: string }> {
    const response = await fetch(`${this.baseUrl}/assign-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminId, region_type: regionType, region_id: regionId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to assign admin')
    }

    return response.json()
  }

  /**
   * Remove an admin from a region
   */
  async removeAdmin(
    adminId: string,
    regionType: 'province' | 'district' | 'palika',
    regionId: number
  ): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${this.baseUrl}/remove-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_id: adminId, region_type: regionType, region_id: regionId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove admin')
    }

    return response.json()
  }
}

export const regionsService = new RegionsClientService()
