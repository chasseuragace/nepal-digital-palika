import { SupabaseClient } from '@supabase/supabase-js'
import {
  IPalikasDatasource,
  PalikaBasicWithTier,
  PalikaPagination,
  PalikaTierFilters,
  PalikasListResult,
  PalikaWithSubscriptionDates,
} from './palikas-datasource'

export class SupabasePalikasDatasource implements IPalikasDatasource {
  constructor(private client: SupabaseClient) {}

  async getAllWithTiers(
    filters: PalikaTierFilters,
    pagination: PalikaPagination
  ): Promise<PalikasListResult> {
    const { tier, provinceId, search } = filters
    const { page, limit } = pagination

    let query = this.client
      .from('palikas')
      .select(
        `
        *,
        subscription_tier:subscription_tier_id(*)
      `,
        { count: 'exact' }
      )

    if (tier) {
      query = query.eq('subscription_tier.name', tier)
    }

    if (provinceId !== undefined) {
      query = query.in(
        'district_id',
        this.client
          .from('districts')
          .select('id')
          .eq('province_id', provinceId) as any
      )
    }

    if (search) {
      query = query.or(
        `name_en.ilike.%${search}%,name_ne.ilike.%${search}%,code.ilike.%${search}%`
      )
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw new Error(error.message)

    return { data: (data as any) || [], count: count || 0 }
  }

  async getAllBasicWithTier(): Promise<PalikaBasicWithTier[]> {
    const { data, error } = await this.client
      .from('palikas')
      .select(
        `
        id,
        name_en,
        subscription_tier_id,
        subscription_start_date,
        subscription_end_date,
        subscription_tiers(id, name, display_name, cost_per_month, cost_per_year)
      `
      )
      .order('name_en', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as any) || []
  }

  async getById(palikaId: number): Promise<PalikaWithSubscriptionDates | null> {
    const { data, error } = await this.client
      .from('palikas')
      .select('id, name_en, subscription_tier_id, subscription_start_date, subscription_end_date')
      .eq('id', palikaId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(error.message)
    }
    return data as PalikaWithSubscriptionDates
  }

  async updateSubscriptionDates(
    palikaId: number,
    subscriptionStartDate: string,
    subscriptionEndDate: string,
    tierId: string
  ): Promise<void> {
    const { error } = await this.client
      .from('palikas')
      .update({
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate,
        subscription_tier_id: tierId,
      })
      .eq('id', palikaId)

    if (error) throw new Error(error.message)
  }

  async 
  async updateTier(palikaId: number, tierId: string): Promise<void> {
    // First, check if this is a first-time assignment (no tier or no end date)
    const { data: current, error: fetchError } = await this.client
      .from('palikas')
      .select('subscription_tier_id, subscription_start_date, subscription_end_date')
      .eq('id', palikaId)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    const isFirstAssignment =
      !current.subscription_tier_id || !current.subscription_end_date

    const updateData: any = { subscription_tier_id: tierId }

    if (isFirstAssignment) {
      updateData.subscription_start_date = new Date().toISOString()
      updateData.subscription_end_date = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString() // NOW() + INTERVAL '1 year'
    }

    const { error } = await this.client
      .from('palikas')
      .update(updateData)
      .eq('id', palikaId)

    if (error) throw new Error(error.message)
  }
}
