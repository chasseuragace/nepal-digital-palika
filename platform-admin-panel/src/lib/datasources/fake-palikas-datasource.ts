import { Palika, PalikaWithTier } from '@/lib/types'
import {
  IPalikasDatasource,
  PalikaBasicWithTier,
  PalikaPagination,
  PalikaTierFilters,
  PalikasListResult,
} from './palikas-datasource'
import { __fakeTiersData } from './fake-tiers-datasource'

const now = new Date().toISOString()
const daysFromNow = (d: number) =>
  new Date(Date.now() + d * 24 * 60 * 60 * 1000).toISOString()

interface FakePalikaRow extends Palika {
  subscription_tier_id: string
  province_id: number
  subscription_start_date?: string | null
  subscription_end_date?: string | null
}

const g = globalThis as any
const palikas: FakePalikaRow[] = g.__fake_palikas ?? (g.__fake_palikas = seedPalikas())

function seedPalikas(): FakePalikaRow[] { return [
  {
    id: 1,
    district_id: 27,
    province_id: 3,
    name_en: 'Kathmandu',
    name_ne: 'काठमाडौं',
    type: 'metropolitan',
    code: 'KTM-MC',
    total_wards: 32,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-premium',
  },
  {
    id: 2,
    district_id: 25,
    province_id: 3,
    name_en: 'Lalitpur',
    name_ne: 'ललितपुर',
    type: 'metropolitan',
    code: 'LLT-MC',
    total_wards: 29,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-premium',
  },
  {
    id: 3,
    district_id: 26,
    province_id: 3,
    name_en: 'Bhaktapur',
    name_ne: 'भक्तपुर',
    type: 'municipality',
    code: 'BKT-MN',
    total_wards: 10,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-tourism',
    subscription_start_date: daysFromNow(-305),
    subscription_end_date: daysFromNow(60),  // Active, 60 days left (green)
  },
  {
    id: 4,
    district_id: 30,
    province_id: 4,
    name_en: 'Pokhara',
    name_ne: 'पोखरा',
    type: 'metropolitan',
    code: 'PKR-MC',
    total_wards: 33,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-premium',
  },
  {
    id: 5,
    district_id: 5,
    province_id: 1,
    name_en: 'Biratnagar',
    name_ne: 'विराटनगर',
    type: 'metropolitan',
    code: 'BRT-MC',
    total_wards: 19,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-tourism',
    subscription_start_date: daysFromNow(-350),
    subscription_end_date: daysFromNow(15),  // Expiring in 15 days (amber)
  },
  {
    id: 6,
    district_id: 19,
    province_id: 2,
    name_en: 'Birgunj',
    name_ne: 'वीरगन्ज',
    type: 'metropolitan',
    code: 'BRG-MC',
    total_wards: 19,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-basic',
  },
  {
    id: 7,
    district_id: 40,
    province_id: 5,
    name_en: 'Butwal',
    name_ne: 'बुटवल',
    type: 'sub_metropolitan',
    code: 'BTW-SMC',
    total_wards: 19,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-tourism',
  },
  {
    id: 8,
    district_id: 53,
    province_id: 7,
    name_en: 'Dhangadhi',
    name_ne: 'धनगढी',
    type: 'sub_metropolitan',
    code: 'DHG-SMC',
    total_wards: 19,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-basic',
    subscription_start_date: daysFromNow(-385),
    subscription_end_date: daysFromNow(-20),  // Expired 20 days ago (red)
  },
  {
    id: 9,
    district_id: 35,
    province_id: 5,
    name_en: 'Lumbini Sanskritik',
    name_ne: 'लुम्बिनी सांस्कृतिक',
    type: 'municipality',
    code: 'LMB-MN',
    total_wards: 13,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-tourism',
  },
  {
    id: 10,
    district_id: 48,
    province_id: 6,
    name_en: 'Birendranagar',
    name_ne: 'वीरेन्द्रनगर',
    type: 'municipality',
    code: 'BRN-MN',
    total_wards: 16,
    is_active: true,
    created_at: now,
    updated_at: now,
    subscription_tier_id: 'tier-basic',
  },
] }

function tierById(id?: string) {
  if (!id) return undefined
  return __fakeTiersData.tiers.find((t) => t.id === id)
}

function toPalikaWithTier(row: FakePalikaRow): PalikaWithTier {
  const tier = tierById(row.subscription_tier_id)
  const { province_id, ...rest } = row
  return {
    ...(rest as Palika),
    subscription_tier_id: row.subscription_tier_id,
    subscription_tier: tier,
  }
}

export class FakePalikasDatasource implements IPalikasDatasource {
  async getAllWithTiers(
    filters: PalikaTierFilters,
    pagination: PalikaPagination
  ): Promise<PalikasListResult> {
    const { tier, provinceId, search } = filters
    const { page, limit } = pagination

    let filtered = palikas.slice()

    if (tier) {
      const tierIds = __fakeTiersData.tiers
        .filter((t) => t.name === tier)
        .map((t) => t.id)
      filtered = filtered.filter((p) =>
        tierIds.includes(p.subscription_tier_id)
      )
    }

    if (provinceId !== undefined) {
      filtered = filtered.filter((p) => p.province_id === provinceId)
    }

    if (search) {
      const needle = search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name_en.toLowerCase().includes(needle) ||
          p.name_ne.toLowerCase().includes(needle) ||
          p.code.toLowerCase().includes(needle)
      )
    }

    const total = filtered.length
    const offset = (page - 1) * limit
    const paged = filtered.slice(offset, offset + limit)

    return {
      data: paged.map(toPalikaWithTier),
      count: total,
    }
  }

  async getAllBasicWithTier(): Promise<PalikaBasicWithTier[]> {
    return palikas
      .slice()
      .sort((a, b) => a.name_en.localeCompare(b.name_en))
      .map((p) => {
        const tier = tierById(p.subscription_tier_id)
        return {
          id: p.id,
          name_en: p.name_en,
          subscription_tier_id: p.subscription_tier_id,
          subscription_start_date: p.subscription_start_date || null,
          subscription_end_date: p.subscription_end_date || null,
          subscription_tiers: tier
            ? {
                id: tier.id,
                name: tier.name,
                display_name: tier.display_name,
                cost_per_month: tier.cost_per_month,
                cost_per_year: tier.cost_per_year,
              }
            : null,
        }
      })
  }

  async getById(palikaId: number): Promise<PalikaWithSubscriptionDates | null> {
    const row = palikas.find((p) => p.id === palikaId)
    if (!row) return null
    return {
      id: row.id,
      name_en: row.name_en,
      subscription_tier_id: row.subscription_tier_id,
      subscription_start_date: row.subscription_start_date || null,
      subscription_end_date: row.subscription_end_date || null,
    }
  }

  async updateSubscriptionDates(
    palikaId: number,
    subscriptionStartDate: string,
    subscriptionEndDate: string,
    tierId: string
  ): Promise<void> {
    const row = palikas.find((p) => p.id === palikaId)
    if (!row) throw new Error(`Palika ${palikaId} not found`)
    row.subscription_start_date = subscriptionStartDate
    row.subscription_end_date = subscriptionEndDate
    row.subscription_tier_id = tierId
    row.updated_at = new Date().toISOString()
  }

  async updateTier(palikaId: number, tierId: string): Promise<void> {
    const row = palikas.find((p) => p.id === palikaId)
    if (!row) throw new Error(`Palika ${palikaId} not found`)
    const tierExists = __fakeTiersData.tiers.some((t) => t.id === tierId)
    if (!tierExists) throw new Error(`Tier ${tierId} not found`)

    const isFirstAssignment =
      !row.subscription_tier_id || !row.subscription_end_date

    row.subscription_tier_id = tierId
    row.updated_at = new Date().toISOString()

    if (isFirstAssignment) {
      row.subscription_start_date = new Date().toISOString()
      row.subscription_end_date = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString() // NOW() + INTERVAL '1 year'
    }
  }
}
