import { SubscriptionTier, Feature } from '@/lib/types'

export type TierWithFeatureCount = SubscriptionTier & { feature_count: number }

export type TierWithFeatures = SubscriptionTier & {
  tier_features: Array<{ feature_id: string; features: Feature }>
}

export interface ITiersDatasource {
  getAllActive(): Promise<TierWithFeatureCount[]>
  getAllWithFeatures(): Promise<TierWithFeatures[]>
}
