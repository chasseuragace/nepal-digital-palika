import { SupabaseClient } from '@supabase/supabase-js'
import {
  ITiersDatasource,
  TierWithFeatureCount,
  TierWithFeatures,
} from './tiers-datasource'

export class SupabaseTiersDatasource implements ITiersDatasource {
  constructor(private client: SupabaseClient) {}

  async getAllActive(): Promise<TierWithFeatureCount[]> {
    const { data, error } = await this.client
      .from('subscription_tiers')
      .select(
        `
        *,
        tier_features(count)
      `
      )
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)

    return (
      data?.map((tier: any) => ({
        ...tier,
        feature_count: tier.tier_features?.[0]?.count || 0,
      })) || []
    )
  }

  async getAllWithFeatures(): Promise<TierWithFeatures[]> {
    const { data, error } = await this.client
      .from('subscription_tiers')
      .select(
        `
        id,
        name,
        display_name,
        cost_per_year,
        tier_features(
          feature_id,
          features(id, code, display_name, category)
        )
      `
      )
      .order('cost_per_year', { ascending: true })

    if (error) throw new Error(error.message)

    return (data as any) || []
  }
}
