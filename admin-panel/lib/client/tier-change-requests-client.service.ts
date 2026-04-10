/**
 * Tier Change Requests Client Service
 * Abstracts tier change request and tiers API calls from UI components
 */

export interface Tier {
  id: string
  name: string
  display_name: string
  description: string
  cost_per_month: number
  cost_per_year: number
}

export interface CurrentSubscription {
  id: number
  name_en: string
  subscription_tier_id: string
  subscription_start_date: string
  subscription_end_date: string
  cost_per_month: number
  subscription_tiers: {
    id: string
    name: string
    display_name: string
    description: string
    cost_per_month: number
    cost_per_year: number
  }
}

export interface TierChangeRequest {
  id: string
  current_tier_id: string
  requested_tier_id: string
  reason: string
  status: string
  requested_at: string
  reviewed_at: string
  review_notes: string
  subscription_tiers: {
    id: string
    name: string
    display_name: string
  }
}

export interface TiersResponse {
  tiers: Tier[]
  currentSubscription: CurrentSubscription
  tierChangeRequests: TierChangeRequest[]
}

class TierChangeRequestsClientService {
  private baseUrl = '/api/tier-change-requests'
  private tiersBaseUrl = '/api/tiers'

  /**
   * Get all tiers and current subscription for a palika
   */
  async getTierData(palikaId: number): Promise<TiersResponse> {
    const response = await fetch(`${this.tiersBaseUrl}?palika_id=${palikaId}`)

    if (!response.ok) {
      throw new Error('Failed to fetch tier data')
    }

    return response.json()
  }

  /**
   * Create a tier change request
   */
  async createRequest(
    palikaId: number,
    userId: string,
    request: {
      requested_tier_id: string
      reason?: string
    }
  ): Promise<{ success: boolean; data?: TierChangeRequest; error?: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Palika-ID': palikaId.toString(),
        'X-User-ID': userId
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create tier change request')
    }

    return response.json()
  }

  /**
   * Delete/cancel a tier change request
   */
  async deleteRequest(
    requestId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${this.baseUrl}/${requestId}`, {
      method: 'DELETE',
      headers: {
        'X-User-ID': userId
      }
    })

    if (!response.ok) {
      throw new Error('Failed to delete tier change request')
    }

    return response.json()
  }
}

export const tierChangeRequestsService = new TierChangeRequestsClientService()
