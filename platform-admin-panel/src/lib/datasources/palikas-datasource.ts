import { PalikaWithTier } from '@/lib/types'

export interface PalikaTierFilters {
  tier?: string
  provinceId?: number
  search?: string
}

export interface PalikaPagination {
  page: number
  limit: number
}

export interface PalikasListResult {
  data: PalikaWithTier[]
  count: number
}

export interface PalikaBasicWithTier {
  id: number
  name_en: string
  subscription_tier_id?: string | null
  subscription_start_date?: string | null
  subscription_end_date?: string | null
  subscription_tiers?: {
    id: string
    name: string
    display_name: string
    cost_per_month?: number
    cost_per_year?: number
  } | null
}

export interface PalikaWithSubscriptionDates {
  id: number
  name_en: string
  subscription_tier_id: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
}

export interface IPalikasDatasource {
  getAllWithTiers(
    filters: PalikaTierFilters,
    pagination: PalikaPagination
  ): Promise<PalikasListResult>
  getAllBasicWithTier(): Promise<PalikaBasicWithTier[]>
  getById(palikaId: number): Promise<PalikaWithSubscriptionDates | null>
  updateTier(palikaId: number, tierId: string): Promise<void>
  updateSubscriptionDates(
    palikaId: number,
    subscriptionStartDate: string,
    subscriptionEndDate: string,
    tierId: string
  ): Promise<void>
}
