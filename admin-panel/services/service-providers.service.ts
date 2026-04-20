/**
 * Service Providers Service
 * Framework-agnostic CRUD for emergency service providers
 */

import {
  ServiceProvider,
  ServiceProviderFilters,
  CreateServiceProviderInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'
import { IServiceProvidersDatasource } from '@/lib/service-providers-datasource'
import { getServiceProvidersDatasource } from '@/lib/service-providers-config'

export class ServiceProvidersService {
  private datasource: IServiceProvidersDatasource

  constructor(datasource?: IServiceProvidersDatasource) {
    this.datasource = datasource || getServiceProvidersDatasource()
  }

  async getAll(
    filters: ServiceProviderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<ServiceProvider>>> {
    try {
      const result = await this.datasource.getAll(filters, pagination)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: 'Failed to fetch service providers' }
    }
  }

  async getById(id: string): Promise<ServiceResponse<ServiceProvider>> {
    try {
      const provider = await this.datasource.getById(id)
      if (!provider) {
        return { success: false, error: 'Service provider not found' }
      }
      return { success: true, data: provider }
    } catch (error) {
      return { success: false, error: 'Failed to fetch service provider' }
    }
  }

  async create(input: CreateServiceProviderInput): Promise<ServiceResponse<ServiceProvider>> {
    try {
      const validation = this.validateInput(input)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const provider = await this.datasource.create(input)
      return { success: true, data: provider, message: 'Service provider created successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to create service provider' }
    }
  }

  async update(id: string, input: Partial<CreateServiceProviderInput>): Promise<ServiceResponse<ServiceProvider>> {
    try {
      const provider = await this.datasource.update(id, input)
      return { success: true, data: provider, message: 'Service provider updated successfully' }
    } catch (error) {
      return { success: false, error: 'Failed to update service provider' }
    }
  }

  async delete(id: string): Promise<ServiceResponse<void>> {
    try {
      await this.datasource.delete(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to delete service provider' }
    }
  }

  private validateInput(input: CreateServiceProviderInput): { valid: boolean; error?: string } {
    if (!input.name_en?.trim()) return { valid: false, error: 'Provider name is required' }
    if (!input.service_type) return { valid: false, error: 'Service type is required' }
    if (!input.phone?.trim()) return { valid: false, error: 'Phone number is required' }
    if (!input.palika_id) return { valid: false, error: 'Palika is required' }
    return { valid: true }
  }
}
