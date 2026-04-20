/**
 * Supabase Service Providers Datasource
 */

import { IServiceProvidersDatasource } from './service-providers-datasource'
import { ServiceProvider, ServiceProviderFilters, CreateServiceProviderInput, PaginationParams, PaginatedResponse } from '@/services/types'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseServiceProvidersDatasource implements IServiceProvidersDatasource {
  constructor(private db: SupabaseClient) {}

  async getAll(filters?: ServiceProviderFilters, pagination?: PaginationParams): Promise<PaginatedResponse<ServiceProvider>> {
    const { page = 1, limit = 25 } = pagination || {}
    const offset = (page - 1) * limit

    let query = this.db.from('service_providers').select('*, palikas!inner(name_en)')

    if (filters?.palika_id) query = query.eq('palika_id', filters.palika_id)
    if (filters?.service_type) query = query.eq('service_type', filters.service_type)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active)
    if (filters?.search) query = query.or(`name_en.ilike.%${filters.search}%,name_ne.ilike.%${filters.search}%,address.ilike.%${filters.search}%`)

    query = query.order('service_type', { ascending: true }).order('name_en', { ascending: true }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    const providers = (data || []).map(this.mapProvider)
    return { data: providers, total: count || providers.length, page, limit, hasMore: providers.length === limit }
  }

  async getById(id: string): Promise<ServiceProvider | null> {
    const { data, error } = await this.db.from('service_providers').select('*, palikas!inner(name_en)').eq('id', id).single()
    if (error || !data) return null
    return this.mapProvider(data)
  }

  async create(input: CreateServiceProviderInput): Promise<ServiceProvider> {
    const { data, error } = await this.db.from('service_providers').insert(input).select().single()
    if (error) throw error
    return this.mapProvider(data)
  }

  async update(id: string, input: Partial<CreateServiceProviderInput>): Promise<ServiceProvider> {
    const { data, error } = await this.db.from('service_providers').update(input).eq('id', id).select().single()
    if (error) throw error
    return this.mapProvider(data)
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.db.from('service_providers').delete().eq('id', id)
    if (error) throw error
    return true
  }

  private mapProvider(data: any): ServiceProvider {
    return {
      id: data.id,
      name_en: data.name_en,
      name_ne: data.name_ne,
      service_type: data.service_type,
      palika_id: data.palika_id,
      status: data.status,
      is_active: data.is_active,
      address: data.address,
      phone: data.phone,
      email: data.email,
      rating_average: data.rating_average || 0,
      rating_count: data.rating_count || 0,
      total_assignments: data.total_assignments || 0,
      completed_assignments: data.completed_assignments || 0,
      average_response_time: data.average_response_time || 0,
      secondary_phones: data.secondary_phones || [],
      is_24_7: data.is_24_7 || false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      vehicle_count: data.vehicle_count || 0,
      total_resolved: data.total_resolved || 0
    } as unknown as ServiceProvider
  }
}
