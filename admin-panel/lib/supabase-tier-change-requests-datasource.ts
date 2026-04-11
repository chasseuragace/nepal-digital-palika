/**
 * Supabase Tier Change Requests Datasource
 * Real implementation using Supabase database
 */

import { supabaseAdmin } from './supabase'
import {
  ITierChangeRequestsDatasource,
  Tier,
  CurrentSubscription,
  TierChangeRequest,
  TierData
} from './tier-change-requests-datasource'

export class SupabaseTierChangeRequestsDatasource implements ITierChangeRequestsDatasource {
  /**
   * Get tier data for a specific palika
   */
  async getTierData(palikaId: number): Promise<TierData> {
    // Fetch all available tiers
    const { data: tiers, error: tiersError } = await supabaseAdmin
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('cost_per_month', { ascending: true })

    if (tiersError) {
      throw new Error(`Failed to fetch tiers: ${tiersError.message}`)
    }

    // Fetch current palika subscription info
    const { data: palika, error: palikaError } = await supabaseAdmin
      .from('palikas')
      .select(`
        id,
        name_en,
        subscription_tier_id,
        subscription_start_date,
        subscription_end_date,
        cost_per_month,
        subscription_tiers(id, name, display_name, description, cost_per_month, cost_per_year)
      `)
      .eq('id', palikaId)
      .single()

    if (palikaError && palikaError.code !== 'PGRST116') {
      throw new Error(`Failed to fetch palika: ${palikaError.message}`)
    }

    // Fetch pending tier change requests
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('tier_change_requests')
      .select(`
        id,
        current_tier_id,
        requested_tier_id,
        reason,
        status,
        requested_at,
        reviewed_at,
        review_notes,
        subscription_tiers!tier_change_requests_requested_tier_id_fkey(id, name, display_name)
      `)
      .eq('palika_id', palikaId)
      .order('requested_at', { ascending: false })

    if (requestsError) {
      throw new Error(`Failed to fetch tier requests: ${requestsError.message}`)
    }

    return {
      tiers,
      currentSubscription: palika || null,
      tierChangeRequests: requests || []
    }
  }

  /**
   * Get all available tiers
   */
  async getAllTiers(): Promise<Tier[]> {
    const { data, error } = await supabaseAdmin
      .from('subscription_tiers')
      .select('*')
      .eq('is_active', true)
      .order('cost_per_month', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch tiers: ${error.message}`)
    }

    return data || []
  }

  /**
   * Get current subscription for a palika
   */
  async getCurrentSubscription(palikaId: number): Promise<CurrentSubscription | null> {
    const { data, error } = await supabaseAdmin
      .from('palikas')
      .select(`
        id,
        name_en,
        subscription_tier_id,
        subscription_start_date,
        subscription_end_date,
        cost_per_month,
        subscription_tiers(id, name, display_name, description, cost_per_month, cost_per_year)
      `)
      .eq('id', palikaId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch subscription: ${error.message}`)
    }

    return data || null
  }

  /**
   * Get pending tier change requests for a palika
   */
  async getTierChangeRequests(palikaId: number): Promise<TierChangeRequest[]> {
    const { data, error } = await supabaseAdmin
      .from('tier_change_requests')
      .select('*')
      .eq('palika_id', palikaId)
      .order('requested_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch requests: ${error.message}`)
    }

    return data || []
  }

  /**
   * Create a new tier change request
   */
  async createRequest(
    palikaId: number,
    adminId: string,
    request: Partial<TierChangeRequest>
  ): Promise<TierChangeRequest> {
    const { data, error } = await supabaseAdmin
      .from('tier_change_requests')
      .insert({
        palika_id: palikaId,
        admin_id: adminId,
        current_tier_id: request.current_tier_id,
        requested_tier_id: request.requested_tier_id,
        reason: request.reason || null,
        status: 'pending',
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create request: ${error.message}`)
    }

    return data as TierChangeRequest
  }

  /**
   * Update a tier change request
   */
  async updateRequest(requestId: string, updates: Partial<TierChangeRequest>): Promise<TierChangeRequest> {
    const { data, error } = await supabaseAdmin
      .from('tier_change_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update request: ${error.message}`)
    }

    return data as TierChangeRequest
  }
}
