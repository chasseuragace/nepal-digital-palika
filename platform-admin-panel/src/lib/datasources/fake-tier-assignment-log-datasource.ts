import {
  ITierAssignmentLogDatasource,
  TierAssignmentLogFilters,
  TierAssignmentLogPagination,
  TierAssignmentLogRow,
} from './tier-assignment-log-datasource'

const daysAgo = (n: number) =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString()

const TIERS = {
  basic: { id: 'tier-basic', name: 'basic', display_name: 'Basic' },
  tourism: { id: 'tier-tourism', name: 'tourism', display_name: 'Tourism' },
  premium: { id: 'tier-premium', name: 'premium', display_name: 'Premium' },
} as const

const PALIKAS: Record<number, { id: number; name_en: string; name_ne: string; code: string }> = {
  1: { id: 1, name_en: 'Kathmandu Metropolitan', name_ne: 'काठमाडौं महानगरपालिका', code: 'KTM-MC' },
  2: { id: 2, name_en: 'Lalitpur Metropolitan', name_ne: 'ललितपुर महानगरपालिका', code: 'LTP-MC' },
  3: { id: 3, name_en: 'Bhaktapur Municipality', name_ne: 'भक्तपुर नगरपालिका', code: 'BKT-MU' },
  4: { id: 4, name_en: 'Pokhara Metropolitan', name_ne: 'पोखरा महानगरपालिका', code: 'PKR-MC' },
  5: { id: 5, name_en: 'Biratnagar Metropolitan', name_ne: 'विराटनगर महानगरपालिका', code: 'BRT-MC' },
  6: { id: 6, name_en: 'Birgunj Metropolitan', name_ne: 'वीरगञ्ज महानगरपालिका', code: 'BRG-MC' },
  7: { id: 7, name_en: 'Bharatpur Metropolitan', name_ne: 'भरतपुर महानगरपालिका', code: 'BRP-MC' },
  8: { id: 8, name_en: 'Butwal Sub-Metropolitan', name_ne: 'बुटवल उपमहानगरपालिका', code: 'BTW-SMC' },
  9: { id: 9, name_en: 'Dharan Sub-Metropolitan', name_ne: 'धरान उपमहानगरपालिका', code: 'DRN-SMC' },
  10: { id: 10, name_en: 'Hetauda Sub-Metropolitan', name_ne: 'हेटौडा उपमहानगरपालिका', code: 'HTD-SMC' },
}

const ADMINS = {
  super: { full_name: 'Ramesh Sharma', email: 'super@admin.com' },
  district: { full_name: 'Sita Karki', email: 'district@admin.com' },
  ops: { full_name: 'Bikash Thapa', email: 'ops@admin.com' },
}

const LOG: TierAssignmentLogRow[] = [
  {
    id: 'tal-001',
    palika_id: 4,
    old_tier_id: TIERS.tourism.id,
    new_tier_id: TIERS.premium.id,
    reason: 'Upgrade to premium for tourism season',
    created_at: daysAgo(1),
    palika: PALIKAS[4],
    old_tier: TIERS.tourism,
    new_tier: TIERS.premium,
    assigned_by: ADMINS.super,
  },
  {
    id: 'tal-002',
    palika_id: 2,
    old_tier_id: TIERS.basic.id,
    new_tier_id: TIERS.tourism.id,
    reason: 'Activated tourism tier',
    created_at: daysAgo(2),
    palika: PALIKAS[2],
    old_tier: TIERS.basic,
    new_tier: TIERS.tourism,
    assigned_by: ADMINS.super,
  },
  {
    id: 'tal-003',
    palika_id: 10,
    old_tier_id: TIERS.tourism.id,
    new_tier_id: TIERS.premium.id,
    reason: 'Upgraded after successful trial',
    created_at: daysAgo(4),
    palika: PALIKAS[10],
    old_tier: TIERS.tourism,
    new_tier: TIERS.premium,
    assigned_by: ADMINS.ops,
  },
  {
    id: 'tal-004',
    palika_id: 5,
    old_tier_id: TIERS.basic.id,
    new_tier_id: TIERS.tourism.id,
    reason: 'Tourism package activated',
    created_at: daysAgo(6),
    palika: PALIKAS[5],
    old_tier: TIERS.basic,
    new_tier: TIERS.tourism,
    assigned_by: ADMINS.district,
  },
  {
    id: 'tal-005',
    palika_id: 3,
    old_tier_id: null,
    new_tier_id: TIERS.tourism.id,
    reason: 'Initial tier assignment',
    created_at: daysAgo(8),
    palika: PALIKAS[3],
    old_tier: null,
    new_tier: TIERS.tourism,
    assigned_by: ADMINS.super,
  },
  {
    id: 'tal-006',
    palika_id: 1,
    old_tier_id: null,
    new_tier_id: TIERS.basic.id,
    reason: 'Onboarded at basic tier',
    created_at: daysAgo(12),
    palika: PALIKAS[1],
    old_tier: null,
    new_tier: TIERS.basic,
    assigned_by: ADMINS.super,
  },
  {
    id: 'tal-007',
    palika_id: 7,
    old_tier_id: TIERS.tourism.id,
    new_tier_id: TIERS.basic.id,
    reason: 'Downgraded due to non-renewal',
    created_at: daysAgo(15),
    palika: PALIKAS[7],
    old_tier: TIERS.tourism,
    new_tier: TIERS.basic,
    assigned_by: ADMINS.ops,
  },
  {
    id: 'tal-008',
    palika_id: 8,
    old_tier_id: null,
    new_tier_id: TIERS.basic.id,
    reason: 'Initial onboarding',
    created_at: daysAgo(20),
    palika: PALIKAS[8],
    old_tier: null,
    new_tier: TIERS.basic,
    assigned_by: ADMINS.district,
  },
  {
    id: 'tal-009',
    palika_id: 9,
    old_tier_id: null,
    new_tier_id: TIERS.basic.id,
    reason: 'Initial onboarding',
    created_at: daysAgo(25),
    palika: PALIKAS[9],
    old_tier: null,
    new_tier: TIERS.basic,
    assigned_by: ADMINS.district,
  },
  {
    id: 'tal-010',
    palika_id: 4,
    old_tier_id: TIERS.basic.id,
    new_tier_id: TIERS.tourism.id,
    reason: 'First upgrade to tourism',
    created_at: daysAgo(30),
    palika: PALIKAS[4],
    old_tier: TIERS.basic,
    new_tier: TIERS.tourism,
    assigned_by: ADMINS.super,
  },
]

export class FakeTierAssignmentLogDatasource implements ITierAssignmentLogDatasource {
  async getAll(
    filters: TierAssignmentLogFilters,
    pagination: TierAssignmentLogPagination
  ): Promise<{ data: TierAssignmentLogRow[]; count: number }> {
    let rows = [...LOG]

    if (filters.palika_id) {
      const pid = parseInt(filters.palika_id, 10)
      rows = rows.filter((r) => r.palika_id === pid)
    }
    if (filters.start_date) {
      const s = new Date(filters.start_date).getTime()
      rows = rows.filter((r) => new Date(r.created_at).getTime() >= s)
    }
    if (filters.end_date) {
      const e = new Date(filters.end_date).getTime()
      rows = rows.filter((r) => new Date(r.created_at).getTime() <= e)
    }

    rows.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const total = rows.length
    const { page, limit } = pagination
    const offset = (page - 1) * limit
    const paged = rows.slice(offset, offset + limit)

    return { data: paged, count: total }
  }
}
