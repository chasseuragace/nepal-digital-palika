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

export class TierValidationService {
  private datasource: ITierValidationDatasource

  constructor(datasource?: ITierValidationDatasource) {
    this.datasource = datasource || getTierValidationDatasource()
  }

  /**
   * Get tier information for a palika
   */
  async getPalikaTierInfo(palikaId: number): Promise<ServiceResponse<TierInfo>> {
    try {
      const info = await this.datasource.getPalikaTierInfo(palikaId)
      if (!info) {
        return {
          error: 'Palika not found',
          status: 404
        }
      }
      return {
        data: info as TierInfo,
        status: 200
      }
    } catch (error) {
      console.error('Error fetching palika tier info:', error)
      return {
        error: 'Failed to fetch tier information',
        status: 500
      }
    }
  }

  /**
   * Check if a palika can access product verification workflow
   * Tier 1: NO verification workflow
   * Tier 2+: YES, but only if approval_required = true
   */
  async canAccessVerificationWorkflow(palikaId: number): Promise<ServiceResponse<boolean>> {
    try {
      const tierRes = await this.getPalikaTierInfo(palikaId)

      if (tierRes.error || !tierRes.data) {
        return {
          error: tierRes.error,
          status: tierRes.status
        }
      }

      const { tierLevel, approvalRequired } = tierRes.data

      // Tier 1: No verification workflow
      if (tierLevel === 1) {
        return {
          data: false,
          status: 200
        }
      }

      // Tier 2+: Only if approval_required is enabled
      return {
        data: approvalRequired,
        status: 200
      }
    } catch (error) {
      console.error('Error checking verification access:', error)
      return {
        error: 'Failed to check verification access',
        status: 500
      }
    }
  }

  /**
   * Get user-friendly error message based on tier
   */
  async getVerificationErrorMessage(palikaId: number): Promise<string> {
    const tierRes = await this.getPalikaTierInfo(palikaId)

    if (tierRes.error || !tierRes.data) {
      return 'Unable to determine tier information'
    }

    const { tierLevel, tierName, approvalRequired } = tierRes.data

    if (tierLevel === 1) {
      return `Product verification is not available for ${tierName} tier palikas. Products are auto-published immediately.`
    }

    if (!approvalRequired) {
      return `Product verification workflow is not enabled for this palika. Contact your administrator to enable approval workflows.`
    }

    return 'Product verification is not available at this time'
  }

  /**
   * Validate that a palika can verify a specific product
   */
  async validateProductVerification(
    palikaId: number,
    productId: string
  ): Promise<ServiceResponse<{ canVerify: boolean; reason?: string }>> {
    try {
      // Check tier access
      const accessRes = await this.canAccessVerificationWorkflow(palikaId)

      if (accessRes.error) {
        return {
          error: accessRes.error,
          status: accessRes.status
        }
      }

      if (!accessRes.data) {
        const errorMsg = await this.getVerificationErrorMessage(palikaId)
        return {
          data: {
            canVerify: false,
            reason: errorMsg
          },
          status: 200
        }
      }

      // Verify product belongs to this palika
      const belongs = await this.datasource.productBelongsToPalika(productId, palikaId)
      if (!belongs) {
        return {
          error: 'Product does not belong to this palika',
          status: 403
        }
      }

      return {
        data: {
          canVerify: true
        },
        status: 200
      }
    } catch (error) {
      console.error('Error validating product verification:', error)
      return {
        error: 'Failed to validate product verification',
        status: 500
      }
    }
  }

  /**
   * Validate that a palika can reject a specific product
   */
  async validateProductRejection(
    palikaId: number,
    productId: string
  ): Promise<ServiceResponse<{ canReject: boolean; reason?: string }>> {
    // Same logic as verification
    const result = await this.validateProductVerification(palikaId, productId)
    if (result.error) {
      return result
    }
    return {
      data: {
        canReject: result.data?.canVerify || false,
        reason: result.data?.reason
      },
      status: result.status
    }
  }

  /**
   * Check if a palika can access business approval workflow
   * Tier 1: NO approval workflow
   * Tier 2+: YES, but only if approval_required = true
   */
  async canAccessBusinessApprovalWorkflow(palikaId: number): Promise<ServiceResponse<boolean>> {
    try {
      const tierRes = await this.getPalikaTierInfo(palikaId)

      if (tierRes.error || !tierRes.data) {
        return {
          error: tierRes.error,
          status: tierRes.status
        }
      }

      const { tierLevel, approvalRequired } = tierRes.data

      // Tier 1: No approval workflow
      if (tierLevel === 1) {
        return {
          data: false,
          status: 200
        }
      }

      // Tier 2+: Only if approval_required is enabled
      return {
        data: approvalRequired,
        status: 200
      }
    } catch (error) {
      console.error('Error checking business approval access:', error)
      return {
        error: 'Failed to check business approval access',
        status: 500
      }
    }
  }

  /**
   * Get user-friendly error message for business approval based on tier
   */
  async getBusinessApprovalErrorMessage(palikaId: number): Promise<string> {
    const tierRes = await this.getPalikaTierInfo(palikaId)

    if (tierRes.error || !tierRes.data) {
      return 'Unable to determine tier information'
    }

    const { tierLevel, tierName, approvalRequired } = tierRes.data

    if (tierLevel === 1) {
      return `Business verification is not available for ${tierName} tier palikas. Businesses are auto-verified immediately.`
    }

    if (!approvalRequired) {
      return `Business verification workflow is not enabled for this palika. Contact your administrator to enable approval workflows.`
    }

    return 'Business verification is not available at this time'
  }

  /**
   * Validate that a palika can approve/reject a specific business
   */
  async validateBusinessApprovalAccess(
    palikaId: number,
    adminId: string
  ): Promise<{ canApprove: boolean; message: string }> {
    try {
      // Check tier access
      const accessRes = await this.canAccessBusinessApprovalWorkflow(palikaId)

      if (accessRes.error) {
        return {
          canApprove: false,
          message: accessRes.error
        }
      }

      if (!accessRes.data) {
        const errorMsg = await this.getBusinessApprovalErrorMessage(palikaId)
        return {
          canApprove: false,
          message: errorMsg
        }
      }

      return {
        canApprove: true,
        message: 'Business approval access granted'
      }
    } catch (error) {
      console.error('Error validating business approval access:', error)
      return {
        canApprove: false,
        message: 'Failed to validate business approval access'
      }
    }
  }

  /**
   * Validate that a palika can verify a specific business
   */
  async validateBusinessVerification(
    palikaId: number,
    businessId: string
  ): Promise<ServiceResponse<{ canVerify: boolean; reason?: string }>> {
    try {
      // Check tier access
      const accessRes = await this.canAccessBusinessApprovalWorkflow(palikaId)

      if (accessRes.error) {
        return {
          error: accessRes.error,
          status: accessRes.status
        }
      }

      if (!accessRes.data) {
        const errorMsg = await this.getBusinessApprovalErrorMessage(palikaId)
        return {
          data: {
            canVerify: false,
            reason: errorMsg
          },
          status: 200
        }
      }

      // Verify business belongs to this palika
      const belongs = await this.datasource.businessBelongsToPalika(businessId, palikaId)
      if (!belongs) {
        return {
          error: 'Business does not belong to this palika',
          status: 403
        }
      }

      return {
        data: {
          canVerify: true
        },
        status: 200
      }
    } catch (error) {
      console.error('Error validating business verification:', error)
      return {
        error: 'Failed to validate business verification',
        status: 500
      }
    }
  }

  /**
   * Validate that a palika can reject a specific business
   */
  async validateBusinessRejection(
    palikaId: number,
    businessId: string
  ): Promise<ServiceResponse<{ canReject: boolean; reason?: string }>> {
    // Same logic as verification
    const result = await this.validateBusinessVerification(palikaId, businessId)
    if (result.error) {
      return result
    }
    return {
      data: {
        canReject: result.data?.canVerify || false,
        reason: result.data?.reason
      },
      status: result.status
    }
  }
}
