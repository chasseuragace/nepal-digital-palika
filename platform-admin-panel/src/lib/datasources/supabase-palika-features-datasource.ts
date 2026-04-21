import { SupabaseClient } from '@supabase/supabase-js'
import { Feature } from '@/lib/types'
import {
  IPalikaFeaturesDatasource,
  PalikaFeaturesResult,
} from './palika-features-datasource'

export class SupabasePalikaFeaturesDatasource implements IPalikaFeaturesDatasource {
  constructor(private client: SupabaseClient) {}

  async getFeaturesForPalika(palikaId: number): Promise<PalikaFeaturesResult> {
    const { data: palikaData, error: palikaError } = await this.client
      .from('palikas')
      .select('subscription_tier_id')
      .eq('id', palikaId)
      .single()

    if (palikaError || !palikaData) {
      throw new Error('Palika not found')
    }

    if (!palikaData.subscription_tier_id) {
      return {
        palika_id: palikaId,
        tier_id: null,
        features: [],
        feature_codes: [],
      }
    }

    const { data: tierFeatures, error: featuresError } = await this.client
      .from('tier_features')
      .select('features(*)')
      .eq('tier_id', palikaData.subscription_tier_id)
      .eq('enabled', true)

    if (featuresError) {
      throw new Error('Failed to fetch features')
    }

    const features: Feature[] =
      (tierFeatures?.map((tf: any) => tf.features) as Feature[]) || []
    const feature_codes = features.map((f) => f.code)

    return {
      palika_id: palikaId,
      tier_id: palikaData.subscription_tier_id,
      features,
      feature_codes,
    }
  }
}
