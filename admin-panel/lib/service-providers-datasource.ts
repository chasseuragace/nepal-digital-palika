/**
 * Abstract Service Providers Datasource
 */

import { ServiceProvider, ServiceProviderFilters, CreateServiceProviderInput, PaginationParams, PaginatedResponse } from '@/services/types'

export interface IServiceProvidersDatasource {
  getAll(filters?: ServiceProviderFilters, pagination?: PaginationParams): Promise<PaginatedResponse<ServiceProvider>>
  getById(id: string): Promise<ServiceProvider | null>
  create(input: CreateServiceProviderInput): Promise<ServiceProvider>
  update(id: string, input: Partial<CreateServiceProviderInput>): Promise<ServiceProvider>
  delete(id: string): Promise<boolean>
}
