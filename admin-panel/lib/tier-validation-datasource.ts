/**
 * Abstract Tier Validation Datasource
 */

export interface TierValidation {
  palika_id: number
  current_tier: string
  can_upgrade: boolean
  requirements_met: boolean
  content_count: number
  max_content: number
}

export interface PalikaTierInfo {
  palikaId: number
  tierId: string
  tierLevel: number
  tierName: string
  approvalRequired: boolean
}

export interface ITierValidationDatasource {
  validateTier(palikaId: number): Promise<TierValidation>
  getTierLimits(tier: string): Promise<{ max_content: number; features: string[] }>
  checkUpgradeEligibility(palikaId: number): Promise<boolean>
  getPalikaTierInfo(palikaId: number): Promise<PalikaTierInfo | null>
  productBelongsToPalika(productId: string, palikaId: number): Promise<boolean>
  businessBelongsToPalika(businessId: string, palikaId: number): Promise<boolean>
}
