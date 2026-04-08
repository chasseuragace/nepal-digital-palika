/**
 * Fake Business Targeting Datasource
 * Mock implementation for UI development without Supabase
 * Implements IBusinessTargetingDatasource interface
 */

import {
  IBusinessTargetingDatasource,
  FilterOptions,
  BusinessResult,
  BusinessTargetingStats,
} from './business-targeting-datasource'

// Mock categories (business types)
const MOCK_CATEGORIES = [
  { id: 1, name: 'Hotel', name_ne: 'होटेल' },
  { id: 2, name: 'Restaurant', name_ne: 'रेस्टुरेन्ट' },
  { id: 3, name: 'Shop', name_ne: 'दोकान' },
  { id: 4, name: 'Cafe', name_ne: 'क्यापे' },
  { id: 5, name: 'Tour Operator', name_ne: 'ट्रिप अपरेटर' },
]

// Mock businesses
const MOCK_BUSINESSES: BusinessResult[] = [
  {
    id: 'b1',
    business_name: 'Himalayan Guest House',
    business_name_ne: 'हिमालयन गेस्ट हाउस',
    ward_number: 1,
    rating_average: 4.5,
    rating_count: 120,
    view_count: 850,
    product_count: 3,
  },
  {
    id: 'b2',
    business_name: 'Mountain View Hotel',
    business_name_ne: 'माउन्टेन भ्यु होटेल',
    ward_number: 2,
    rating_average: 4.2,
    rating_count: 95,
    view_count: 650,
    product_count: 2,
  },
  {
    id: 'b3',
    business_name: 'Local Kitchen Restaurant',
    business_name_ne: 'स्थानीय रसोई रेस्टुरेन्ट',
    ward_number: 1,
    rating_average: 4.8,
    rating_count: 210,
    view_count: 1200,
    product_count: 5,
  },
  {
    id: 'b4',
    business_name: 'Traditional Nepali Dishes',
    business_name_ne: 'परम्परागत नेपाली खाना',
    ward_number: 2,
    rating_average: 4.0,
    rating_count: 45,
    view_count: 320,
    product_count: 4,
  },
  {
    id: 'b5',
    business_name: 'Adventure Tours Nepal',
    business_name_ne: 'एडभेन्चर ट्यूर नेपाल',
    ward_number: 1,
    rating_average: 4.7,
    rating_count: 180,
    view_count: 950,
    product_count: 3,
  },
  {
    id: 'b6',
    business_name: 'Cozy Coffee Corner',
    business_name_ne: 'कोजी कफी कार्नर',
    ward_number: 3,
    rating_average: 3.8,
    rating_count: 32,
    view_count: 180,
    product_count: 2,
  },
  {
    id: 'b7',
    business_name: 'Heritage Craft Shop',
    business_name_ne: 'सम्पदा शिल्प दोकान',
    ward_number: 2,
    rating_average: 4.6,
    rating_count: 88,
    view_count: 420,
    product_count: 4,
  },
  {
    id: 'b8',
    business_name: 'Souvenir Store',
    business_name_ne: 'स्मृति दोकान',
    ward_number: 1,
    rating_average: 3.9,
    rating_count: 56,
    view_count: 310,
    product_count: 3,
  },
]

// Map business names to categories (for filtering)
const BUSINESS_CATEGORY_MAP: Record<string, number> = {
  'Himalayan Guest House': 1,
  'Mountain View Hotel': 1,
  'Local Kitchen Restaurant': 2,
  'Traditional Nepali Dishes': 2,
  'Adventure Tours Nepal': 5,
  'Cozy Coffee Corner': 4,
  'Heritage Craft Shop': 3,
  'Souvenir Store': 3,
}

// Map business IDs to their owner/staff users (for business-targeted notifications)
const BUSINESS_USERS_MAP: Record<string, Array<{ id: string; name: string }>> = {
  'b1': [
    { id: 'user-b1-1', name: 'Ramesh Kumar (Himalayan Guest House)' },
    { id: 'user-b1-2', name: 'Anita Sharma (Staff)' },
  ],
  'b2': [
    { id: 'user-b2-1', name: 'Pradeep Poudel (Mountain View Hotel)' },
  ],
  'b3': [
    { id: 'user-b3-1', name: 'Rita Tamang (Local Kitchen Restaurant)' },
    { id: 'user-b3-2', name: 'Suman Rai (Chef)' },
    { id: 'user-b3-3', name: 'Laxmi Khadka (Staff)' },
  ],
  'b4': [
    { id: 'user-b4-1', name: 'Deepak Nepal (Traditional Nepali Dishes)' },
  ],
  'b5': [
    { id: 'user-b5-1', name: 'Hari Sharma (Adventure Tours Nepal)' },
    { id: 'user-b5-2', name: 'Kalpana Gautam (Guide)' },
  ],
  'b6': [
    { id: 'user-b6-1', name: 'Sunita Panta (Cozy Coffee Corner)' },
  ],
  'b7': [
    { id: 'user-b7-1', name: 'Mohan Singh (Heritage Craft Shop)' },
    { id: 'user-b7-2', name: 'Tara Kumari (Artisan)' },
  ],
  'b8': [
    { id: 'user-b8-1', name: 'Arun Thapa (Souvenir Store)' },
  ],
}

// ─── Datasource Class ───

export class FakeBusinessTargetingDatasource implements IBusinessTargetingDatasource {
  async getFilterOptions(palikaId: number): Promise<FilterOptions> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return {
      wards: [1, 2, 3],
      businessTypes: MOCK_CATEGORIES,
      ratingRange: { min: 3.0, max: 5.0 },
    }
  }

  async queryBusinesses(
    palikaId: number,
    filters: {
      wards?: number[]
      business_type_id?: number[]
      min_rating?: number
      min_view_count?: number
      min_product_count?: number
      search?: string
      page?: number
      pageSize?: number
    }
  ) {
    await new Promise(resolve => setTimeout(resolve, 150))
    return queryFakeBusinesses(filters)
  }

  async getTargetingStats(palikaId: number): Promise<BusinessTargetingStats> {
    await new Promise(resolve => setTimeout(resolve, 100))
    return getFakeTargetingStats()
  }

  async fetchUsersForBusinesses(businessIds: string[]): Promise<Array<{ id: string; name: string }>> {
    await new Promise(resolve => setTimeout(resolve, 100))
    const users: Array<{ id: string; name: string }> = []
    for (const businessId of businessIds) {
      const businessUsers = BUSINESS_USERS_MAP[businessId] || []
      users.push(...businessUsers)
    }
    return users
  }
}

// ─── Legacy Functions (for backward compatibility) ───

/**
 * Get filter options (wards, business types, rating range)
 */
export function getFakeFilterOptions(): FilterOptions {
  return {
    wards: [1, 2, 3],
    businessTypes: MOCK_CATEGORIES,
    ratingRange: { min: 3.0, max: 5.0 },
  }
}

/**
 * Get targeting statistics
 */
export function getFakeTargetingStats(): BusinessTargetingStats {
  return {
    totalBusinesses: MOCK_BUSINESSES.length,
    activeBusinesses: 7, // Most are active
    publishedBusinesses: 7, // Most are published
    avgRating: 4.3,
    totalProducts: MOCK_BUSINESSES.reduce((sum, b) => sum + b.product_count, 0),
  }
}

/**
 * Query businesses with filters (fake version)
 * Matches QueryBuilder filtering logic
 */
export function queryFakeBusinesses(filters: {
  wards?: number[]
  business_type_id?: number[]
  min_rating?: number
  min_view_count?: number
  min_product_count?: number
  is_active?: boolean
  is_24_7?: boolean
  search?: string
  page?: number
  pageSize?: number
}): {
  data: BusinessResult[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
} {
  const pageSize = filters.pageSize || 20
  const page = filters.page || 1
  const offset = (page - 1) * pageSize

  let results = [...MOCK_BUSINESSES]

  // Filter by wards
  if (filters.wards && filters.wards.length > 0) {
    results = results.filter(b => filters.wards!.includes(b.ward_number))
  }

  // Filter by business type (category)
  if (filters.business_type_id && filters.business_type_id.length > 0) {
    results = results.filter(b => {
      const categoryId = BUSINESS_CATEGORY_MAP[b.business_name]
      return filters.business_type_id!.includes(categoryId)
    })
  }

  // Filter by minimum rating
  if (filters.min_rating && filters.min_rating > 0) {
    results = results.filter(b => b.rating_average >= filters.min_rating!)
  }

  // Filter by minimum view count
  if (filters.min_view_count && filters.min_view_count > 0) {
    results = results.filter(b => b.view_count >= filters.min_view_count!)
  }

  // Filter by minimum product count
  if (filters.min_product_count && filters.min_product_count > 0) {
    results = results.filter(b => b.product_count >= filters.min_product_count!)
  }

  // Filter by search term
  if (filters.search && filters.search.trim()) {
    const search = filters.search.trim().toLowerCase()
    results = results.filter(
      b =>
        b.business_name.toLowerCase().includes(search) ||
        b.business_name_ne.includes(filters.search!.trim())
    )
  }

  // Calculate total after all filters
  const total = results.length

  // Apply pagination
  const paginated = results.slice(offset, offset + pageSize)

  return {
    data: paginated,
    total,
    page,
    pageSize,
    hasMore: offset + pageSize < total,
  }
}
