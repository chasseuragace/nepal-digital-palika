/**
 * Fake Marketplace Analytics Datasource
 * In-memory fixtures grounded in the Supabase schema. Every record is scoped
 * to a palika_id so palika-level filtering mirrors production behavior.
 *
 * Seed palikas align with lib/fake-regions-datasource.ts & mock-admin-users.ts:
 *   5  = Kathmandu Metropolitan  (palika@admin.com)
 *   10 = Bhaktapur Municipality  (test@admin.com)
 *   8  = Lalitpur Metropolitan
 * Other palika ids return empty summaries — the same shape the Supabase
 * implementation returns when no businesses exist yet.
 *
 * created_at timestamps are generated relative to "now" at module load so the
 * 30-day trend is always populated no matter when the dev server boots.
 */

import {
  AnalyticsResult,
  BusinessAnalytics,
  IMarketplaceAnalyticsDatasource,
  MarketplaceAnalyticsSummary,
  ProductAnalytics,
  UserAnalytics,
} from './marketplace-analytics-datasource'

// ---------- Schema-shaped records ----------

type Profile = {
  id: string
  name: string
  default_palika_id: number
  created_at: string
}

type Business = {
  id: string
  palika_id: number
  business_name: string
  business_type_id: number
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  created_at: string
}

type MarketplaceProduct = {
  id: string
  business_id: string
  palika_id: number
  name_en: string
  marketplace_category_id: number
  is_approved: boolean
  status: 'published' | 'archived' | 'out_of_stock'
  view_count: number
  created_at: string
}

// ---------- Human-readable category lookup ----------

const BUSINESS_TYPE_NAMES: Record<number, string> = {
  101: 'Hotels & Stays',
  102: 'Restaurants',
  103: 'Handicrafts',
  104: 'Tour Operators',
  105: 'Transport',
  106: 'Retail',
}

const MARKETPLACE_CATEGORY_NAMES: Record<number, string> = {
  201: 'Pottery',
  202: 'Textiles',
  203: 'Food Products',
  204: 'Tour Packages',
  205: 'Handicrafts',
  206: 'Souvenirs',
}

// ---------- Helpers ----------

const DAY_MS = 24 * 60 * 60 * 1000

function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * DAY_MS).toISOString()
}

function pad(n: number): string {
  return String(n).padStart(3, '0')
}

// ---------- Fixture construction ----------

function buildProfiles(): Profile[] {
  const profiles: Profile[] = []
  const spec: Array<{ palikaId: number; count: number }> = [
    { palikaId: 5, count: 48 }, // Kathmandu Metro
    { palikaId: 10, count: 22 }, // Bhaktapur Muni
    { palikaId: 8, count: 14 }, // Lalitpur Metro
    { palikaId: 6, count: 5 }, // Kirtipur (long-tail)
  ]
  let counter = 0
  for (const { palikaId, count } of spec) {
    for (let i = 0; i < count; i++) {
      // Spread created_at across the last 60 days so newThisWeek/newThisMonth
      // split realistically. Bias towards more signups in last 14 days.
      const ageDays = Math.floor(((i * 37 + palikaId * 11) % 60) * (i < 5 ? 0.25 : 1))
      profiles.push({
        id: `fake-profile-${pad(++counter)}`,
        name: `User ${palikaId}-${i + 1}`,
        default_palika_id: palikaId,
        created_at: daysAgoISO(ageDays),
      })
    }
  }
  return profiles
}

function buildBusinesses(): Business[] {
  const businesses: Business[] = []
  // Deterministic palika-by-palika seed. business_type_id mirrors categories
  // (entity_type='business'). verification_status mirrors the DB check constraint.
  const rows: Array<Omit<Business, 'id' | 'created_at'> & { daysAgo: number }> = [
    // ---- Kathmandu Metropolitan (palika 5) ----
    { palika_id: 5, business_name: 'Hotel Everest View', business_type_id: 101, verification_status: 'verified', daysAgo: 42 },
    { palika_id: 5, business_name: 'Thamel Tandoori', business_type_id: 102, verification_status: 'verified', daysAgo: 35 },
    { palika_id: 5, business_name: 'Himalayan Handicraft Co.', business_type_id: 103, verification_status: 'verified', daysAgo: 28 },
    { palika_id: 5, business_name: 'Kathmandu Trekking Services', business_type_id: 104, verification_status: 'pending', daysAgo: 9 },
    { palika_id: 5, business_name: 'Valley Ride Transport', business_type_id: 105, verification_status: 'pending', daysAgo: 4 },
    { palika_id: 5, business_name: 'Durbar Bazaar', business_type_id: 106, verification_status: 'verified', daysAgo: 20 },
    { palika_id: 5, business_name: 'Momo Palace', business_type_id: 102, verification_status: 'rejected', daysAgo: 15 },
    { palika_id: 5, business_name: 'Yeti Lodge', business_type_id: 101, verification_status: 'suspended', daysAgo: 55 },

    // ---- Bhaktapur Municipality (palika 10) ----
    { palika_id: 10, business_name: 'Pottery Square Cooperative', business_type_id: 103, verification_status: 'verified', daysAgo: 31 },
    { palika_id: 10, business_name: 'Bhaktapur Heritage Stay', business_type_id: 101, verification_status: 'verified', daysAgo: 25 },
    { palika_id: 10, business_name: 'Juju Dhau Dairy', business_type_id: 102, verification_status: 'verified', daysAgo: 18 },
    { palika_id: 10, business_name: 'Newa Crafts', business_type_id: 103, verification_status: 'pending', daysAgo: 6 },
    { palika_id: 10, business_name: 'Nyatapola Tours', business_type_id: 104, verification_status: 'pending', daysAgo: 2 },

    // ---- Lalitpur Metropolitan (palika 8) ----
    { palika_id: 8, business_name: 'Patan Metal Works', business_type_id: 103, verification_status: 'verified', daysAgo: 40 },
    { palika_id: 8, business_name: 'Godawari Gardens Café', business_type_id: 102, verification_status: 'verified', daysAgo: 12 },
    { palika_id: 8, business_name: 'Mangal Bazaar Souvenirs', business_type_id: 106, verification_status: 'pending', daysAgo: 3 },
  ]
  rows.forEach((row, idx) => {
    businesses.push({
      id: `fake-business-${pad(idx + 1)}`,
      palika_id: row.palika_id,
      business_name: row.business_name,
      business_type_id: row.business_type_id,
      verification_status: row.verification_status,
      created_at: daysAgoISO(row.daysAgo),
    })
  })
  return businesses
}

function buildProducts(businesses: Business[]): MarketplaceProduct[] {
  // Each business gets 1-4 products. Category IDs are drawn from a deterministic
  // rotation so byCategory has variety per palika.
  const products: MarketplaceProduct[] = []
  const catalogByBusinessType: Record<number, Array<{ name: string; catId: number }>> = {
    101: [
      { name: 'Deluxe Room 1 Night', catId: 204 },
      { name: 'Airport Pickup', catId: 204 },
    ],
    102: [
      { name: 'Set Menu for Two', catId: 203 },
      { name: 'Thakali Thali', catId: 203 },
      { name: 'Cooking Class', catId: 204 },
    ],
    103: [
      { name: 'Clay Pot Set', catId: 201 },
      { name: 'Pashmina Shawl', catId: 202 },
      { name: 'Hand-loom Carpet', catId: 202 },
      { name: 'Wood-carved Figurine', catId: 205 },
    ],
    104: [
      { name: '3-Day Valley Trek', catId: 204 },
      { name: 'City Heritage Tour', catId: 204 },
    ],
    105: [
      { name: 'Private Car Half Day', catId: 204 },
    ],
    106: [
      { name: 'Handicraft Gift Box', catId: 206 },
      { name: 'Local Souvenir Pack', catId: 206 },
      { name: 'Prayer Flag Bundle', catId: 206 },
    ],
  }

  let productCounter = 0
  businesses.forEach((biz, bizIdx) => {
    // Don't create products for rejected/suspended businesses — matches real
    // tenant behavior where those are gated out.
    if (biz.verification_status === 'rejected' || biz.verification_status === 'suspended') return

    const catalog = catalogByBusinessType[biz.business_type_id] || []
    const take = (bizIdx % 3) + 1 // 1, 2 or 3 products per biz
    for (let i = 0; i < Math.min(take, catalog.length); i++) {
      const entry = catalog[i]
      // Approved products track the parent business: verified → approved,
      // pending → pending. Keeps is_approved in sync with verification_status
      // so the dashboard cards stay internally consistent.
      const isApproved = biz.verification_status === 'verified'
      const daysAgoBase = Math.max(0, parseDaysAgo(biz.created_at) - i * 3)
      const spreadDays = (productCounter % 10) // keep them over ~10 days
      const productAgeDays = Math.max(0, daysAgoBase - spreadDays)

      products.push({
        id: `fake-product-${pad(++productCounter)}`,
        business_id: biz.id,
        palika_id: biz.palika_id,
        name_en: entry.name,
        marketplace_category_id: entry.catId,
        is_approved: isApproved,
        status: 'published',
        view_count: 40 + ((productCounter * 17) % 260),
        created_at: daysAgoISO(productAgeDays),
      })
    }
  })
  return products
}

function parseDaysAgo(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS))
}

// ---------- Query helpers ----------

function within(iso: string, fromMs: number, toMs: number): boolean {
  const t = new Date(iso).getTime()
  return t >= fromMs && t < toMs
}

function buildTrend(
  rows: Array<{ created_at: string }>
): Array<{ date: string; count: number }> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const trend: Array<{ date: string; count: number }> = []
  for (let i = 29; i >= 0; i--) {
    const dayStart = new Date(today)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const count = rows.filter((r) =>
      within(r.created_at, dayStart.getTime(), dayEnd.getTime())
    ).length
    trend.push({
      date: dayStart.toISOString().split('T')[0],
      count,
    })
  }
  return trend
}

function groupByCategory<T>(
  rows: T[],
  keyFn: (row: T) => string
): Array<{ category: string; count: number }> {
  const grouped: Record<string, number> = {}
  for (const row of rows) {
    const k = keyFn(row)
    grouped[k] = (grouped[k] || 0) + 1
  }
  return Object.entries(grouped)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
}

// ---------- Datasource ----------

export class FakeMarketplaceAnalyticsDatasource implements IMarketplaceAnalyticsDatasource {
  private profiles: Profile[]
  private businesses: Business[]
  private products: MarketplaceProduct[]

  constructor() {
    this.profiles = buildProfiles()
    this.businesses = buildBusinesses()
    this.products = buildProducts(this.businesses)
  }

  async getUserAnalytics(palikaId: number): Promise<AnalyticsResult<UserAnalytics>> {
    const scoped = this.profiles.filter((p) => p.default_palika_id === palikaId)
    const now = Date.now()
    const weekCut = now - 7 * DAY_MS
    const monthCut = now - 30 * DAY_MS
    return {
      data: {
        total: scoped.length,
        newThisWeek: scoped.filter((p) => new Date(p.created_at).getTime() >= weekCut).length,
        newThisMonth: scoped.filter((p) => new Date(p.created_at).getTime() >= monthCut).length,
        trend: buildTrend(scoped),
      },
      status: 200,
    }
  }

  async getBusinessAnalytics(palikaId: number): Promise<AnalyticsResult<BusinessAnalytics>> {
    const scoped = this.businesses.filter((b) => b.palika_id === palikaId)
    const now = Date.now()
    const weekCut = now - 7 * DAY_MS
    const monthCut = now - 30 * DAY_MS
    const byVerificationStatus = {
      pending: scoped.filter((b) => b.verification_status === 'pending').length,
      verified: scoped.filter((b) => b.verification_status === 'verified').length,
      rejected: scoped.filter((b) => b.verification_status === 'rejected').length,
      suspended: scoped.filter((b) => b.verification_status === 'suspended').length,
    }
    return {
      data: {
        total: scoped.length,
        byCategory: groupByCategory(
          scoped,
          (b) => BUSINESS_TYPE_NAMES[b.business_type_id] || `type_${b.business_type_id}`
        ),
        byVerificationStatus,
        newThisWeek: scoped.filter((b) => new Date(b.created_at).getTime() >= weekCut).length,
        newThisMonth: scoped.filter((b) => new Date(b.created_at).getTime() >= monthCut).length,
        trend: buildTrend(scoped),
      },
      status: 200,
    }
  }

  async getProductAnalytics(palikaId: number): Promise<AnalyticsResult<ProductAnalytics>> {
    const scoped = this.products.filter((p) => p.palika_id === palikaId)

    if (scoped.length === 0) {
      return {
        data: {
          total: 0,
          byCategory: [],
          byVerificationStatus: { pending: 0, verified: 0, rejected: 0 },
          mostViewed: [],
          recent: [],
          trend: [],
        },
        status: 200,
      }
    }

    return {
      data: {
        total: scoped.length,
        byCategory: groupByCategory(
          scoped,
          (p) => MARKETPLACE_CATEGORY_NAMES[p.marketplace_category_id] || `cat_${p.marketplace_category_id}`
        ),
        byVerificationStatus: {
          pending: scoped.filter((p) => p.is_approved === false).length,
          verified: scoped.filter((p) => p.is_approved === true).length,
          rejected: 0,
        },
        mostViewed: [...scoped]
          .sort((a, b) => b.view_count - a.view_count)
          .slice(0, 5)
          .map((p) => ({ id: p.id, title: p.name_en, views: p.view_count })),
        recent: [...scoped]
          .sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          .slice(0, 5)
          .map((p) => ({ id: p.id, title: p.name_en, createdAt: p.created_at })),
        trend: buildTrend(scoped),
      },
      status: 200,
    }
  }

  async getMarketplaceSummary(
    palikaId: number
  ): Promise<AnalyticsResult<MarketplaceAnalyticsSummary>> {
    const [usersRes, businessesRes, productsRes] = await Promise.all([
      this.getUserAnalytics(palikaId),
      this.getBusinessAnalytics(palikaId),
      this.getProductAnalytics(palikaId),
    ])
    if (usersRes.error || businessesRes.error || productsRes.error) {
      return { error: 'Failed to fetch marketplace summary', status: 500 }
    }
    return {
      data: {
        users: usersRes.data!,
        businesses: businessesRes.data!,
        products: productsRes.data!,
      },
      status: 200,
    }
  }
}
