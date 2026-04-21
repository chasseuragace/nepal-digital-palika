import {
  AdminEntity,
  CreateAdminInput,
  IAdminsDatasource,
} from '@/lib/datasources/admins-datasource'
import { getAdminsDatasource } from '@/lib/datasources/admins-config'
import { ServiceResponse } from './types'

export class AdminsService {
  private datasource: IAdminsDatasource

  constructor(datasource?: IAdminsDatasource) {
    this.datasource = datasource ?? getAdminsDatasource()
  }

  /** List all admins. */
  async getAll(): Promise<ServiceResponse<AdminEntity[]>> {
    try {
      const data = await this.datasource.getAll()
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch admins'
      return { success: false, error: message }
    }
  }

  /** Fetch a single admin by id. */
  async getById(id: string): Promise<ServiceResponse<AdminEntity>> {
    if (!id) return { success: false, error: 'Admin ID is required' }
    try {
      const data = await this.datasource.getById(id)
      if (!data) return { success: false, error: 'Admin not found' }
      return { success: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch admin'
      return { success: false, error: message }
    }
  }

  /** Create a new admin with role/region validation. */
  async create(input: CreateAdminInput): Promise<ServiceResponse<AdminEntity>> {
    const { email, password, full_name, role, province_id, district_id, palika_id } = input

    if (!email || !password || !full_name || !role) {
      return {
        success: false,
        error: 'Missing required fields: email, password, full_name, role',
      }
    }

    switch (role) {
      case 'province_admin':
        if (!province_id) {
          return { success: false, error: 'Province ID is required for province_admin role' }
        }
        break
      case 'district_admin':
        if (!district_id) {
          return { success: false, error: 'District ID is required for district_admin role' }
        }
        break
      case 'palika_admin':
        if (!palika_id) {
          return { success: false, error: 'Palika ID is required for palika_admin role' }
        }
        break
      default:
        return { success: false, error: 'Invalid role' }
    }

    try {
      const data = await this.datasource.create(input)
      return { success: true, data, message: 'Admin user created successfully' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create admin'
      return { success: false, error: message }
    }
  }

  /** Delete an admin by id. */
  async delete(id: string): Promise<ServiceResponse<null>> {
    if (!id) return { success: false, error: 'Admin ID is required' }
    try {
      await this.datasource.delete(id)
      return { success: true, data: null, message: 'Admin user deleted successfully' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete admin'
      return { success: false, error: message }
    }
  }
}
