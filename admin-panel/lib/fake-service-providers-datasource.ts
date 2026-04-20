/**
 * Fake Service Providers Datasource
 */

import { IServiceProvidersDatasource } from './service-providers-datasource'
import { ServiceProvider, ServiceProviderFilters, CreateServiceProviderInput, PaginationParams, PaginatedResponse } from '@/services/types'

export class FakeServiceProvidersDatasource implements IServiceProvidersDatasource {
  private providers: ServiceProvider[] = [
    { id: 'fake-sp-1', name_en: 'Hospital', name_ne: 'अस्पताल', service_type: 'ambulance', palika_id: 1, status: 'available', is_active: true, address: 'Main St', phone: '123', rating_average: 4, rating_count: 10, total_assignments: 5, completed_assignments: 4, average_response_time: 15, secondary_phones: [], email: '', vehicle_count: 2, total_resolved: 4, is_24_7: false, created_at: '', updated_at: '' } as unknown as ServiceProvider,
  ]

  async getAll(filters?: ServiceProviderFilters, pagination?: PaginationParams): Promise<PaginatedResponse<ServiceProvider>> {
    await this.delay(100)
    const { page = 1, limit = 25 } = pagination || {}
    const offset = (page - 1) * limit
    return { data: this.providers.slice(offset, offset + limit), total: this.providers.length, page, limit, hasMore: false }
  }

  async getById(id: string): Promise<ServiceProvider | null> {
    await this.delay(50)
    return this.providers.find(p => p.id === id) || null
  }

  async create(input: CreateServiceProviderInput): Promise<ServiceProvider> {
    await this.delay(100)
    const newProvider = { ...input, id: `fake-sp-${Date.now()}`, status: 'available', is_active: true, rating_average: 0, rating_count: 0, total_assignments: 0, completed_assignments: 0, average_response_time: 0, secondary_phones: [], vehicle_count: 0, total_resolved: 0, is_24_7: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as unknown as ServiceProvider
    this.providers.push(newProvider)
    return newProvider
  }

  async update(id: string, input: Partial<CreateServiceProviderInput>): Promise<ServiceProvider> {
    await this.delay(100)
    const index = this.providers.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Not found')
    this.providers[index] = { ...this.providers[index], ...input }
    return this.providers[index]
  }

  async delete(id: string): Promise<boolean> {
    await this.delay(100)
    const index = this.providers.findIndex(p => p.id === id)
    if (index === -1) return false
    this.providers.splice(index, 1)
    return true
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
