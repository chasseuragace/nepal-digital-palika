import {
  IPalikasDatasource,
  PalikaBasicWithTier,
  PalikaPagination,
  PalikaTierFilters,
  PalikasListResult,
} from '@/lib/datasources/palikas-datasource'
import { getPalikasDatasource } from '@/lib/datasources/palikas-config'
import { ServiceResponse } from './types'

export class PalikasService {
  private datasource: IPalikasDatasource

  constructor(datasource?: IPalikasDatasource) {
    this.datasource = datasource ?? getPalikasDatasource()
  }

  async getAllWithTiers(
    filters: PalikaTierFilters,
    pagination: PalikaPagination
  ): Promise<ServiceResponse<PalikasListResult>> {
    try {
      const data = await this.datasource.getAllWithTiers(filters, pagination)
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch palikas'
      return { success: false, error: message }
    }
  }

  async getAllBasicWithTier(): Promise<ServiceResponse<PalikaBasicWithTier[]>> {
    try {
      const data = await this.datasource.getAllBasicWithTier()
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch palikas'
      return { success: false, error: message }
    }
  }

  async updateTier(
    palikaId: number,
    tierId: string
  ): Promise<ServiceResponse<null>> {
    try {
      await this.datasource.updateTier(palikaId, tierId)
      return { success: true, data: null }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update palika tier'
      return { success: false, error: message }
    }
  }
}
