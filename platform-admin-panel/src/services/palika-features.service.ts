import {
  IPalikaFeaturesDatasource,
  PalikaFeaturesResult,
} from '@/lib/datasources/palika-features-datasource'
import { getPalikaFeaturesDatasource } from '@/lib/datasources/palika-features-config'
import { ServiceResponse } from './types'

export class PalikaFeaturesService {
  private datasource: IPalikaFeaturesDatasource

  constructor(datasource?: IPalikaFeaturesDatasource) {
    this.datasource = datasource ?? getPalikaFeaturesDatasource()
  }

  /** Returns all features for a palika's assigned tier. Error message 'Palika not found' should be surfaced as HTTP 404 by the route. */
  async getFeaturesForPalika(
    palikaId: number
  ): Promise<ServiceResponse<PalikaFeaturesResult>> {
    try {
      const data = await this.datasource.getFeaturesForPalika(palikaId)
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch palika features'
      return { success: false, error: message }
    }
  }
}
