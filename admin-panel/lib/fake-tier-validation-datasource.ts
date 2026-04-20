/**
 * Fake Tier Validation Datasource
 */

import { ITierValidationDatasource, TierValidation, PalikaTierInfo } from './tier-validation-datasource'

export class FakeTierValidationDatasource implements ITierValidationDatasource {
  async validateTier(palikaId: number): Promise<TierValidation> {
    await this.delay(100)
    return {
      palika_id: palikaId,
      current_tier: 'bronze',
      can_upgrade: true,
      requirements_met: true,
      content_count: 15,
      max_content: 50
    }
  }

  async getTierLimits(tier: string): Promise<{ max_content: number; features: string[] }> {
    await this.delay(50)
    const limits: Record<string, { max_content: number; features: string[] }> = {
      bronze: { max_content: 50, features: ['basic_analytics', 'content_management'] },
      silver: { max_content: 200, features: ['advanced_analytics', 'content_management', 'priority_support'] },
      gold: { max_content: 1000, features: ['all_features', 'custom_integrations', 'dedicated_support'] }
    }
    return limits[tier] || limits.bronze
  }

  async checkUpgradeEligibility(palikaId: number): Promise<boolean> {
    await this.delay(50)
    return true
  }

  async getPalikaTierInfo(palikaId: number): Promise<PalikaTierInfo | null> {
    await this.delay(50)
    return {
      palikaId,
      tierId: 'tier-2',
      tierLevel: 2,
      tierName: 'Silver',
      approvalRequired: true
    }
  }

  async productBelongsToPalika(productId: string, palikaId: number): Promise<boolean> {
    await this.delay(50)
    return true
  }

  async businessBelongsToPalika(businessId: string, palikaId: number): Promise<boolean> {
    await this.delay(50)
    return true
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
