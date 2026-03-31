/**
 * Service Providers Service
 * Framework-agnostic CRUD for emergency service providers
 */

import { DatabaseClient } from './database-client'
import {
  ServiceProvider,
  ServiceProviderFilters,
  CreateServiceProviderInput,
  PaginationParams,
  PaginatedResponse,
  ServiceResponse
} from './types'

export class ServiceProvidersService {
  private db: DatabaseClient

  constructor(db: DatabaseClient) {
    this.db = db
  }

  async getAll(
    filters: ServiceProviderFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ServiceResponse<PaginatedResponse<ServiceProvider>>> {
    try {
      const { page = 1, limit = 25 } = pagination
      const offset = (page - 1) * limit

      let query = this.db
        .from('service_providers')
        .select(`
          *,
          palikas!inner(name_en)
        `)

      if (filters.palika_id) {
        query = query.eq('palika_id', filters.palika_id)
      }
      if (filters.service_type) {
        query = query.eq('service_type', filters.service_type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active)
      }
      if (filters.search) {
        query = query.or(
          `name_en.ilike.%${filters.search}%,name_ne.ilike.%${filters.search}%,address.ilike.%${filters.search}%`
        )
      }

      query = query
        .order('service_type', { ascending: true })
        .order('name_en', { ascending: true })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch service providers' }
      }

      const providers = (data || []).map(this.mapProvider)

      return {
        success: true,
        data: {
          data: providers,
          total: count || providers.length,
          page,
          limit,
          hasMore: providers.length === limit
        }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch service providers' }
    }
  }

  async getById(id: string): Promise<ServiceResponse<ServiceProvider>> {
    try {
      const { data, error } = await this.db
        .from('service_providers')
        .select(`
          *,
          palikas!inner(name_en)
        `)
        .eq('id', id)
        .single()

      if (error || !data) {
        return { success: false, error: 'Service provider not found' }
      }

      return { success: true, data: this.mapProvider(data) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch service provider' }
    }
  }

  async getByPalika(
    palikaId: number,
    serviceType?: string
  ): Promise<ServiceResponse<ServiceProvider[]>> {
    try {
      let query = this.db
        .from('service_providers')
        .select('*')
        .eq('palika_id', palikaId)
        .eq('is_active', true)

      if (serviceType) {
        query = query.eq('service_type', serviceType)
      }

      query = query.order('service_type').order('name_en')

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch providers' }
      }

      return { success: true, data: (data || []).map(this.mapProvider) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch providers' }
    }
  }

  async getAvailable(
    palikaId: number,
    serviceType?: string
  ): Promise<ServiceResponse<ServiceProvider[]>> {
    try {
      let query = this.db
        .from('service_providers')
        .select('*')
        .eq('palika_id', palikaId)
        .eq('is_active', true)
        .eq('status', 'available')

      if (serviceType) {
        query = query.eq('service_type', serviceType)
      }

      query = query.order('response_time_avg_minutes', { ascending: true })

      const { data, error } = await query

      if (error) {
        return { success: false, error: error.message || 'Failed to fetch available providers' }
      }

      return { success: true, data: (data || []).map(this.mapProvider) }
    } catch (error) {
      return { success: false, error: 'Failed to fetch available providers' }
    }
  }

  async create(input: CreateServiceProviderInput, adminId: string): Promise<ServiceResponse<ServiceProvider>> {
    try {
      const validation = this.validateInput(input)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      const providerData = {
        palika_id: input.palika_id,
        name_en: input.name_en,
        name_ne: input.name_ne,
        service_type: input.service_type,
        phone: input.phone,
        email: input.email,
        secondary_phones: input.secondary_phones || [],
        location: `POINT(${input.longitude} ${input.latitude})`,
        address: input.address,
        ward_number: input.ward_number,
        coverage_area: input.coverage_area,
        vehicle_count: input.vehicle_count || 1,
        services: input.services || [],
        is_24_7: input.is_24_7 ?? true,
        status: 'available',
        is_active: true,
        created_by: adminId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await this.db
        .from('service_providers')
        .insert(providerData)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to create service provider' }
      }

      return {
        success: true,
        data: this.mapProvider(data),
        message: 'Service provider created successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to create service provider' }
    }
  }

  async update(id: string, input: Partial<CreateServiceProviderInput>, adminId: string): Promise<ServiceResponse<ServiceProvider>> {
    try {
      const updateData: any = {
        ...input,
        updated_by: adminId,
        updated_at: new Date().toISOString()
      }

      if (input.latitude && input.longitude) {
        updateData.location = `POINT(${input.longitude} ${input.latitude})`
        delete updateData.latitude
        delete updateData.longitude
      }

      const { data, error } = await this.db
        .from('service_providers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message || 'Failed to update service provider' }
      }

      return {
        success: true,
        data: this.mapProvider(data),
        message: 'Service provider updated successfully'
      }
    } catch (error) {
      return { success: false, error: 'Failed to update service provider' }
    }
  }

  async updateStatus(id: string, status: ServiceProvider['status']): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.db
        .from('service_providers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message || 'Failed to update status' }
      }

      return { success: true, message: `Provider status updated to ${status}` }
    } catch (error) {
      return { success: false, error: 'Failed to update status' }
    }
  }

  async deactivate(id: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.db
        .from('service_providers')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) {
        return { success: false, error: error.message || 'Failed to deactivate provider' }
      }

      return { success: true, message: 'Service provider deactivated' }
    } catch (error) {
      return { success: false, error: 'Failed to deactivate provider' }
    }
  }

  private mapProvider(data: any): ServiceProvider {
    return {
      id: data.id,
      palika_id: data.palika_id,
      name_en: data.name_en,
      name_ne: data.name_ne,
      service_type: data.service_type,
      phone: data.phone,
      email: data.email,
      secondary_phones: data.secondary_phones,
      location: data.location ? { lat: data.location.coordinates?.[1], lng: data.location.coordinates?.[0] } : undefined,
      address: data.address,
      ward_number: data.ward_number,
      coverage_area: data.coverage_area,
      vehicle_count: data.vehicle_count || 0,
      services: data.services,
      operating_hours: data.operating_hours,
      is_24_7: data.is_24_7,
      status: data.status,
      response_time_avg_minutes: data.response_time_avg_minutes,
      rating_average: data.rating_average || 0,
      rating_count: data.rating_count || 0,
      total_assignments: data.total_assignments || 0,
      total_resolved: data.total_resolved || 0,
      is_active: data.is_active,
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      palika_name: data.palikas?.name_en
    }
  }

  private validateInput(input: CreateServiceProviderInput): { valid: boolean; error?: string } {
    if (!input.name_en?.trim()) return { valid: false, error: 'Provider name is required' }
    if (!input.service_type) return { valid: false, error: 'Service type is required' }
    if (!input.phone?.trim()) return { valid: false, error: 'Phone number is required' }
    if (!input.palika_id) return { valid: false, error: 'Palika is required' }
    if (!input.latitude || !input.longitude) return { valid: false, error: 'Location coordinates are required' }
    return { valid: true }
  }
}
