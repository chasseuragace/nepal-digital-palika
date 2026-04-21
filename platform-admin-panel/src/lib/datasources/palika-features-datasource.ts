import { Feature } from '@/lib/types'

export interface PalikaFeaturesResult {
  palika_id: number
  tier_id: string | null
  features: Feature[]
  feature_codes: string[]
}

export interface IPalikaFeaturesDatasource {
  /** Returns all features for the palika's subscription tier. Throws Error('Palika not found') if palika id doesn't exist. */
  getFeaturesForPalika(palikaId: number): Promise<PalikaFeaturesResult>
}
