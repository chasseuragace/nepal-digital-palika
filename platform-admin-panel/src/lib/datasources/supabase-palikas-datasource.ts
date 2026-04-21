import { SupabaseClient } from '@supabase/supabase-js'
import {
  IPalikasDatasource,
  PalikaBasicWithTier,
  PalikaPagination,
  PalikaTierFilters,
  PalikasListResult,
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
        subscription_tiers(id, name, display_name)
      `
      )
      .order('name_en', { ascending: true })

    if (error) throw new Error(error.message)
    return (data as any) || []
  }

  async updateTier(palikaId: number, tierId: string): Promise<void> {
    const { error } = await this.client
      .from('palikas')
      .update({ subscription_tier_id: tierId })
      .eq('id', palikaId)

    if (error) throw new Error(error.message)
  }
}
