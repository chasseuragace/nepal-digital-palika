import {
  ITiersDatasource,
  TierWithFeatureCount,
  TierWithFeatures,
} from '@/lib/datasources/tiers-datasource'
import { getTiersDatasource } from '@/lib/datasources/tiers-config'
import { ServiceResponse } from './types'

export class TiersService {
  private datasource: ITiersDatasource

  constructor(datasource?: ITiersDatasource) {
    this.datasource = datasource ?? getTiersDatasource()
  }

  async getAllActive(): Promise<ServiceResponse<TierWithFeatureCount[]>> {
    try {
      const data = await this.datasource.getAllActive()
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch tiers'
      return { success: false, error: message }
    }
  }

  async getAllWithFeatures(): Promise<ServiceResponse<TierWithFeatures[]>> {
    try {
      const data = await this.datasource.getAllWithFeatures()
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch tiers'
      return { success: false, error: message }
    }
  }
}
