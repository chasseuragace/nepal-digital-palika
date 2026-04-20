/**
 * Supabase Tier Validation Datasource
 */

import { ITierValidationDatasource, TierValidation, PalikaTierInfo } from './tier-validation-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseTierValidationDatasource implements ITierValidationDatasource {
  constructor(private db: SupabaseClient) {}

  async validateTier(palikaId: number): Promise<TierValidation> {
    const { data: palika } = await this.db.from('palikas').select('subscription_tier').eq('id', palikaId).single()
    const tier = palika?.subscription_tier || 'bronze'

    const limits = await this.getTierLimits(tier)
    const { count } = await this.db.from('heritage_sites').select('id', { count: 'exact', head: true }).eq('palika_id', palikaId)

    return {
      palika_id: palikaId,
      current_tier: tier,
      can_upgrade: tier !== 'gold',
      requirements_met: (count || 0) < limits.max_content,
      content_count: count || 0,
      max_content: limits.max_content
    }
  }

  async getTierLimits(tier: string): Promise<{ max_content: number; features: string[] }> {
    const limits: Record<string, { max_content: number; features: string[] }> = {
      bronze: { max_content: 50, features: ['basic_analytics', 'content_management'] },
      silver: { max_content: 200, features: ['advanced_analytics', 'content_management', 'priority_support'] },
      gold: { max_content: 1000, features: ['all_features', 'custom_integrations', 'dedicated_support'] }
    }
    return limits[tier] || limits.bronze
  }

  async checkUpgradeEligibility(palikaId: number): Promise<boolean> {
    const validation = await this.validateTier(palikaId)
    return validation.can_upgrade && validation.requirements_met
  }

  async getPalikaTierInfo(palikaId: number): Promise<PalikaTierInfo | null> {
    const { data: palika } = await this.db.from('palikas').select('id, subscription_tier_id').eq('id', palikaId).single()
    if (!palika) return null

    const { data: tier } = await this.db.from('subscription_tiers').select('id, name, tier_level').eq('id', palika.subscription_tier_id).single()
    if (!tier) return null

    const { data: settings } = await this.db.from('palika_settings').select('approval_required').eq('palika_id', palikaId).single()
    const approvalRequired = settings?.approval_required ?? false

    return {
      palikaId,
      tierId: tier.id,
      tierLevel: tier.tier_level,
      tierName: tier.name,
      approvalRequired
    }
  }

  async productBelongsToPalika(productId: string, palikaId: number): Promise<boolean> {
    const { data: product } = await this.db.from('marketplace_products').select('palika_id').eq('id', productId).single()
    return product?.palika_id === palikaId
  }

  async businessBelongsToPalika(businessId: string, palikaId: number): Promise<boolean> {
    const { data: business } = await this.db.from('businesses').select('palika_id').eq('id', businessId).single()
    return business?.palika_id === palikaId
  }
}
