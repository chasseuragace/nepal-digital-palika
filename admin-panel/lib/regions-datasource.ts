/**
 * Abstract Regions Datasource
 */

export interface AdminUser {
  id: string
  full_name: string
  role: string
}

export interface AdminAssignment {
  id: number
  admin_id: string
  region_type: 'province' | 'district' | 'palika'
  region_id: number
  assigned_at: string
  admin_users?: AdminUser[]
}

export interface PalikaWithAdmins {
  id: number
  district_id: number
  name_en: string
  name_ne: string
  code: string
  type?: string
  admins: AdminAssignment[]
}

export interface DistrictWithAdmins {
  id: number
  province_id: number
  name_en: string
  name_ne: string
  code: string
  type: string
  admins: AdminAssignment[]
  palikas: PalikaWithAdmins[]
}

export interface ProvinceWithAdmins {
  id: number
  name_en: string
  name_ne: string
  code: string
  type: string
  admins: AdminAssignment[]
  districts: DistrictWithAdmins[]
}

export interface IRegionsDatasource {
  getRegionHierarchy(): Promise<ProvinceWithAdmins[]>
  assignAdminToRegion(adminId: string, regionType: string, regionId: number): Promise<AdminAssignment>
  removeAdminFromRegion(adminRegionId: number): Promise<void>
}
