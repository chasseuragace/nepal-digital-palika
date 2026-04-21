import { ITierValidationDatasource, PalikaTierInfo } from '@/lib/tier-validation-datasource'
import { getTierValidationDatasource } from '@/lib/tier-validation-config'

export interface TierInfo {
  palikaId: number
  tierId: string
  tierLevel: number
  tierName: string
  approvalRequired: boolean
}

export interface ServiceResponse<T> {
  data?: T
  error?: string
  status: number
}

/**
 * TierValidationService
 *
 * Surfaces a palika's subscription tier as read-only metadata for the admin
 * UI (the tier name label on the marketplace/businesses page, the tier card
 * on the dashboard, `/api/tier-info`). It no longer gates behaviour —
 * approval / verification / rejection workflows run regardless of tier, in
 * line with the tier de-gating decision: tiers are metadata, not a
 * functionality switch.
 *
 * The legacy gate methods (canAccessBusinessApprovalWorkflow,
 * validateBusinessApprovalAccess, validateBusinessVerification,
 * validateBusinessRejection, canAccessVerificationWorkflow,
 * validateProductVerification, validateProductRejection,
 * getBusinessApprovalErrorMessage, getVerificationErrorMessage) were
 * deleted in the same sweep that removed their route callers. If a future
 * dynamic-policy layer needs tier-based gating, introduce it as a dedicated
 * service rather than reviving this.
 */
export class TierValidationService {
  private datasource: ITierValidationDatasource

  constructor(datasource?: ITierValidationDatasource) {
    this.datasource = datasource || getTierValidationDatasource()
  }

  /**
   * Get tier information for a palika.
   */
  async getPalikaTierInfo(palikaId: number): Promise<ServiceResponse<TierInfo>> {
    try {
      const info = await this.datasource.getPalikaTierInfo(palikaId)
      if (!info) {
        return { error: 'Palika not found', status: 404 }
      }
      return { data: info as TierInfo, status: 200 }
    } catch (error) {
      console.error('Error fetching palika tier info:', error)
      return { error: 'Failed to fetch tier information', status: 500 }
    }
  }
}
