/**
 * Abstract Tier Change Requests Datasource
 * Defines contract for querying/storing tier data and change requests
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

export interface Tier {
  id: string
  name: string
  display_name: string
  description: string
  cost_per_month: number
  cost_per_year: number
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface CurrentSubscription {
  id: number
  name_en: string
  subscription_tier_id: string
  subscription_start_date: string
  subscription_end_date: string
  cost_per_month: number
  subscription_tiers: Tier
}

export interface TierChangeRequest {
  id: string
  palika_id?: number
  current_tier_id: string
  requested_tier_id: string
  reason: string
  status: string
  requested_by?: string
  requested_at: string
  reviewed_by?: string
  reviewed_at: string
  review_notes: string
  effective_date?: string
  created_at?: string
  updated_at?: string
}

export interface TierData {
  tiers: Tier[]
  currentSubscription: CurrentSubscription | null
  tierChangeRequests: TierChangeRequest[]
}

export interface ITierChangeRequestsDatasource {
  /**
   * Get tier data for a specific palika
   * Returns available tiers, current subscription, and pending requests
   */
  getTierData(palikaId: number): Promise<TierData>

  /**
   * Get all available tiers
   */
  getAllTiers(): Promise<Tier[]>

  /**
   * Get current subscription for a palika
   */
  getCurrentSubscription(palikaId: number): Promise<CurrentSubscription | null>

  /**
   * Get pending tier change requests for a palika
   */
  getTierChangeRequests(palikaId: number): Promise<TierChangeRequest[]>

  /**
   * Get a tier change request by ID
   */
  getRequestById(requestId: string): Promise<TierChangeRequest | null>

  /**
   * Create a new tier change request
   */
  createRequest(palikaId: number, adminId: string, request: Partial<TierChangeRequest>): Promise<TierChangeRequest>

  /**
   * Update a tier change request
   */
  updateRequest(requestId: string, updates: Partial<TierChangeRequest>): Promise<TierChangeRequest>

  /**
   * Delete a tier change request
   */
  deleteRequest(requestId: string): Promise<boolean>
}
