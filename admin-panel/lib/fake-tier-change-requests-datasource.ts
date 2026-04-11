/**
 * Fake Tier Change Requests Datasource
 * Mock implementation for development/testing without Supabase
 */

import {
  ITierChangeRequestsDatasource,
  Tier,
  CurrentSubscription,
  TierChangeRequest,
  TierData
} from './tier-change-requests-datasource'

/**
 * Mock tiers data
 */
const MOCK_TIERS: Tier[] = [
  {
    id: 'tier-1',
    name: 'Starter',
    display_name: 'Starter Pack',
    description: 'Perfect for small tourism businesses and local palikas getting started',
    cost_per_month: 50,
    cost_per_year: 500,
    sort_order: 1,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tier-2',
    name: 'Professional',
    display_name: 'Professional Plan',
    description: 'Comprehensive features for established palikas and growing businesses',
    cost_per_month: 150,
    cost_per_year: 1500,
    sort_order: 2,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'tier-3',
    name: 'Enterprise',
    display_name: 'Enterprise Solution',
    description: 'Full-featured platform with dedicated support for large operations',
    cost_per_month: 500,
    cost_per_year: 5000,
    sort_order: 3,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

/**
 * Mock palika subscriptions (keyed by palika_id)
 */
const MOCK_SUBSCRIPTIONS: Record<number, CurrentSubscription | null> = {
  1: {
    id: 1,
    name_en: 'Bhaktapur Metropolitan',
    subscription_tier_id: 'tier-2',
    subscription_start_date: '2024-01-01',
    subscription_end_date: '2024-12-31',
    cost_per_month: 150,
    subscription_tiers: MOCK_TIERS[1]
  },
  2: {
    id: 2,
    name_en: 'Kathmandu Metropolitan',
    subscription_tier_id: 'tier-3',
    subscription_start_date: '2024-01-01',
    subscription_end_date: '2024-12-31',
    cost_per_month: 500,
    subscription_tiers: MOCK_TIERS[2]
  },
  3: {
    id: 3,
    name_en: 'Lalitpur Metropolitan',
    subscription_tier_id: 'tier-1',
    subscription_start_date: '2024-02-01',
    subscription_end_date: '2025-01-31',
    cost_per_month: 50,
    subscription_tiers: MOCK_TIERS[0]
  }
}

/**
 * Mock tier change requests
 */
const MOCK_REQUESTS: TierChangeRequest[] = [
  {
    id: 'req-1',
    palika_id: 1,
    current_tier_id: 'tier-1',
    requested_tier_id: 'tier-2',
    reason: 'Growing business needs more features',
    status: 'pending',
    requested_by: 'admin-uuid-1',
    requested_at: '2024-04-05T10:00:00Z',
    reviewed_at: '',
    review_notes: '',
    created_at: '2024-04-05T10:00:00Z',
    updated_at: '2024-04-05T10:00:00Z'
  },
  {
    id: 'req-2',
    palika_id: 2,
    current_tier_id: 'tier-2',
    requested_tier_id: 'tier-3',
    reason: 'Need enterprise features and support',
    status: 'approved',
    requested_by: 'admin-uuid-2',
    requested_at: '2024-04-01T14:30:00Z',
    reviewed_by: 'admin-uuid-reviewer',
    reviewed_at: '2024-04-02T09:00:00Z',
    review_notes: 'Approved. User ready for enterprise features.',
    created_at: '2024-04-01T14:30:00Z',
    updated_at: '2024-04-02T09:00:00Z'
  }
]

export class FakeTierChangeRequestsDatasource implements ITierChangeRequestsDatasource {
  /**
   * Get tier data for a specific palika
   */
  async getTierData(palikaId: number): Promise<TierData> {
    return {
      tiers: MOCK_TIERS,
      currentSubscription: MOCK_SUBSCRIPTIONS[palikaId] || null,
      tierChangeRequests: MOCK_REQUESTS.slice(0, 2)
    }
  }

  /**
   * Get all available tiers
   */
  async getAllTiers(): Promise<Tier[]> {
    return MOCK_TIERS
  }

  /**
   * Get current subscription for a palika
   */
  async getCurrentSubscription(palikaId: number): Promise<CurrentSubscription | null> {
    return MOCK_SUBSCRIPTIONS[palikaId] || null
  }

  /**
   * Get pending tier change requests for a palika
   */
  async getTierChangeRequests(palikaId: number): Promise<TierChangeRequest[]> {
    // In real implementation, would filter by palika_id
    return MOCK_REQUESTS
  }

  /**
   * Create a new tier change request
   */
  async createRequest(
    palikaId: number,
    adminId: string,
    request: Partial<TierChangeRequest>
  ): Promise<TierChangeRequest> {
    const newRequest: TierChangeRequest = {
      id: `req-${Date.now()}`,
      current_tier_id: request.current_tier_id || MOCK_SUBSCRIPTIONS[palikaId]?.subscription_tier_id || 'tier-1',
      requested_tier_id: request.requested_tier_id || 'tier-2',
      reason: request.reason || '',
      status: 'pending',
      requested_at: new Date().toISOString(),
      reviewed_at: '',
      review_notes: ''
    }
    MOCK_REQUESTS.push(newRequest)
    return newRequest
  }

  /**
   * Update a tier change request
   */
  async updateRequest(requestId: string, updates: Partial<TierChangeRequest>): Promise<TierChangeRequest> {
    const request = MOCK_REQUESTS.find(r => r.id === requestId)
    if (!request) {
      throw new Error(`Tier change request ${requestId} not found`)
    }
    Object.assign(request, updates)
    return request
  }
}
