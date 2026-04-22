/**
 * Abstract Palikas Datasource
 */

export interface Province {
  id: number
  name_en: string
  name_ne: string
  code: string
}

export interface District {
  id: number
  name_en: string
  name_ne: string
  code: string
  province_id: number
}

export interface Palika {
  id: number
  name_en: string
  name_ne: string
  code: string
  district_id: number
  center_point?: {
    latitude: number
    longitude: number
  } | null
}

export interface IPalikasDatasource {
  getProvinces(): Promise<Province[]>
  getDistricts(provinceId?: number): Promise<District[]>
  getPalikas(districtId?: number): Promise<Palika[]>
  getPalikaById(id: number): Promise<Palika | null>
}
