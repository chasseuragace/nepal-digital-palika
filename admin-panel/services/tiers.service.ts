/**
 * Tiers Service
 * Orchestrates tier data and tier change request operations
 * Uses ITierChangeRequestsDatasource for data access
 */

import { ITierChangeRequestsDatasource, TierData, TierChangeRequest } from '@/lib/tier-change-requests-datasource'
import { getTierChangeRequestsDatasource } from '@/lib/tier-change-requests-config'

export class TiersService {
  private datasource: ITierChangeRequestsDatasource

  constructor(datasource?: ITierChangeRequestsDatasource) {
    this.datasource = datasource || getTierChangeRequestsDatasource()
  }

  /**
   * Get all tier data for a palika (tiers, subscription, requests)
   */
  async getTierData(palikaId: number) {
    try {
      return await this.datasource.getTierData(palikaId)
    } catch (error) {
      console.error('Error fetching tier data:', error)
      throw error
    }
  }

  /**
   * Create a tier change request
   */
  async createTierChangeRequest(
    palikaId: number,
    adminId: string,
    requestedTierId: string,
    reason?: string
  ): Promise<TierChangeRequest> {
    try {
      // Get current subscription to set current_tier_id
      const subscription = await this.datasource.getCurrentSubscription(palikaId)

      return await this.datasource.createRequest(palikaId, adminId, {
        current_tier_id: subscription?.subscription_tier_id,
        requested_tier_id: requestedTierId,
        reason
      })
    } catch (error) {
      console.error('Error creating tier change request:', error)
      throw error
    }
  }

  /**
   * Update a tier change request (admin only)
   */
  async updateTierChangeRequest(
    requestId: string,
    status: string,
    reviewNotes?: string
  ): Promise<TierChangeRequest> {
    try {
      return await this.datasource.updateRequest(requestId, {
        status,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating tier change request:', error)
      throw error
    }
  }
}
