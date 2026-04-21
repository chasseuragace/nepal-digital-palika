export interface AdminProvinceRelation {
  id: number
  name_en: string
}

export interface AdminDistrictRelation {
  id: number
  name_en: string
  province_id: number
  provinces: AdminProvinceRelation | null
}

export interface AdminPalikaRelation {
  id: number
  name_en: string
  district_id: number
  districts: AdminDistrictRelation | null
}

export interface AdminEntity {
  id: string
  full_name: string
  role: string
  palika_id: number | null
  is_active: boolean
  created_at: string
  palikas: AdminPalikaRelation | null
  email: string
}

export interface CreateAdminInput {
  email: string
  password: string
  full_name: string
  role: string
  province_id?: number
  district_id?: number
  palika_id?: number
}

export interface IAdminsDatasource {
  getAll(): Promise<AdminEntity[]>
  getById(id: string): Promise<AdminEntity | null>
  create(input: CreateAdminInput): Promise<AdminEntity>
  delete(id: string): Promise<void>
}
