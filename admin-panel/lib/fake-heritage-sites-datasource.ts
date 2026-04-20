/**
 * Fake Heritage Sites Datasource
 * Mock implementation for development/testing without Supabase
 */

import { HeritageSite, HeritageSiteFilters, CreateHeritageSiteInput, PaginationParams } from '@/services/types'
import { IHeritageSitesDatasource } from './heritage-sites-datasource'

/**
 * Mock data grounded in actual Supabase schema:
 * - Palikas: 1=Bhaktapur Metropolitan, 2=Kathmandu Metropolitan, 3=Lalitpur Metropolitan
 * - Categories: heritage_site entity type categories
 * - location: MUST be present (NOT NULL in DB)
 * - heritage_status: world_heritage | national | provincial | local | proposed
 * - status: draft | published | archived
 * - ward_number: 1-35 (or null)
 */
const MOCK_SITES: HeritageSite[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    palika_id: 1, // Bhaktapur Metropolitan
    name_en: 'Bhaktapur Durbar Square',
    name_ne: 'भक्तपुर दरबार वर्ग',
    slug: 'bhaktapur-durbar-square',
    category_id: 1, // Heritage Site category
    site_type: 'heritage_complex',
    heritage_status: 'world_heritage',
    ward_number: 1,
    address: 'Durbar Marg, Bhaktapur',
    location: { lat: 27.6717, lng: 85.4307 }, // REQUIRED - NOT NULL in DB
    short_description: 'Ancient royal palace complex and UNESCO World Heritage Site',
    short_description_ne: 'पुरानो राजकीय महल परिसर र युनेस्को विश्व सम्पदा स्थल',
    full_description: 'Bhaktapur Durbar Square is a historic palace complex featuring traditional Newari architecture. Built in the 16th century, it showcases intricate wood carving and brick work.',
    full_description_ne: 'भक्तपुर दरबार वर्ग १६ औं शताब्दीमा निर्मित ऐतिहासिक महल परिसर हो।',
    opening_hours: { monday: '09:00-17:00', tuesday: '09:00-17:00', wednesday: '09:00-17:00', thursday: '09:00-17:00', friday: '09:00-17:00', saturday: '09:00-17:00', sunday: '09:00-17:00' },
    entry_fee: { local_adult: 200, local_child: 50, foreign_adult: 1000, foreign_child: 500, currency: 'NPR' },
    accessibility_info: { wheelchair_accessible: false, parking: true, restrooms: true, guide_available: true },
    best_time_to_visit: 'October to November',
    average_visit_duration_minutes: 120,
    view_count: 1250,
    status: 'published',
    is_featured: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    palika_name: 'Bhaktapur Metropolitan',
    category_name: 'Heritage Site'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    palika_id: 2, // Kathmandu Metropolitan
    name_en: 'Pashupatinath Temple',
    name_ne: 'पशुपतिनाथ मन्दिर',
    slug: 'pashupatinath-temple',
    category_id: 1,
    site_type: 'temple',
    heritage_status: 'world_heritage',
    ward_number: 5,
    address: 'Bagmati River, Pashupatinath, Kathmandu',
    location: { lat: 27.7172, lng: 85.324 },
    short_description: 'Sacred Hindu temple complex on the banks of Bagmati River',
    short_description_ne: 'बाग्मती नदीको किनारमा अवस्थित पवित्र हिन्दु मन्दिर परिसर',
    full_description: 'Pashupatinath Temple is one of the most sacred temples in Hinduism and a UNESCO World Heritage Site. The temple complex features traditional pagoda architecture.',
    full_description_ne: 'पशुपतिनाथ मन्दिर हिन्दु धर्मको सबैभन्दा पवित्र मन्दिरहरू मध्ये एक हो।',
    opening_hours: { monday: '04:00-19:00', tuesday: '04:00-19:00', wednesday: '04:00-19:00', thursday: '04:00-19:00', friday: '04:00-19:00', saturday: '04:00-19:00', sunday: '04:00-19:00' },
    entry_fee: { local_adult: 0, local_child: 0, foreign_adult: 1000, foreign_child: 500, currency: 'NPR' },
    accessibility_info: { wheelchair_accessible: false, parking: false, restrooms: true, guide_available: true },
    best_time_to_visit: 'October to March',
    average_visit_duration_minutes: 90,
    view_count: 2100,
    status: 'published',
    is_featured: true,
    created_at: '2024-01-10T08:00:00Z',
    updated_at: '2024-01-10T08:00:00Z',
    palika_name: 'Kathmandu Metropolitan',
    category_name: 'Heritage Site'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    palika_id: 3, // Lalitpur Metropolitan
    name_en: 'Patan Durbar Square',
    name_ne: 'पाटन दरबार वर्ग',
    slug: 'patan-durbar-square',
    category_id: 1,
    site_type: 'heritage_complex',
    heritage_status: 'world_heritage',
    ward_number: 3,
    address: 'Mangal Bazar, Patan, Lalitpur',
    location: { lat: 27.6743, lng: 85.3244 },
    short_description: 'Historic Newari town with ancient royal palace and temples',
    short_description_ne: 'पुरानो राजकीय महल र मन्दिरहरू सहित ऐतिहासिक नेवारी शहर',
    full_description: 'Patan (Lalitpur) Durbar Square is home to some of the finest examples of Newari architecture. The square contains temples, palaces, and courtyards dating back centuries.',
    full_description_ne: 'पाटन दरबार वर्ग नेवारी वास्तुकलाको सबैभन्दा राम्रो उदाहरणहरूको घर हो।',
    opening_hours: { monday: '09:00-17:00', tuesday: '09:00-17:00', wednesday: '09:00-17:00', thursday: '09:00-17:00', friday: '09:00-17:00', saturday: '09:00-17:00', sunday: '09:00-17:00' },
    entry_fee: { local_adult: 200, local_child: 50, foreign_adult: 1000, foreign_child: 500, currency: 'NPR' },
    accessibility_info: { wheelchair_accessible: false, parking: true, restrooms: true, guide_available: true },
    best_time_to_visit: 'September to November',
    average_visit_duration_minutes: 120,
    view_count: 890,
    status: 'published',
    is_featured: false,
    created_at: '2024-01-20T14:20:00Z',
    updated_at: '2024-01-20T14:20:00Z',
    palika_name: 'Lalitpur Metropolitan',
    category_name: 'Heritage Site'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    palika_id: 2, // Kathmandu Metropolitan
    name_en: 'Swayambhunath Stupa',
    name_ne: 'स्वयम्भूनाथ स्तुप',
    slug: 'swayambhunath-stupa',
    category_id: 1,
    site_type: 'stupa',
    heritage_status: 'world_heritage',
    ward_number: 15,
    address: 'Swayambhunath Hill, Kathmandu',
    location: { lat: 27.7109, lng: 85.2899 },
    short_description: 'Ancient Buddhist stupa sitting atop a hill overlooking Kathmandu Valley',
    short_description_ne: 'काठमाडौं उपत्यकालाई अवलोकन गर्ने पहाडको शिखरमा अवस्थित पुरानो बौद्ध स्तुप',
    full_description: 'Swayambhunath is one of the oldest and most sacred Buddhist sites in Nepal. The golden spire and all-seeing eyes are iconic symbols of Nepal. The site offers panoramic views of the Kathmandu Valley.',
    full_description_ne: 'स्वयम्भूनाथ नेपालको सबैभन्दा पुरानो र पवित्र बौद्ध स्थलहरू मध्ये एक हो।',
    opening_hours: { monday: '08:00-18:00', tuesday: '08:00-18:00', wednesday: '08:00-18:00', thursday: '08:00-18:00', friday: '08:00-18:00', saturday: '08:00-18:00', sunday: '08:00-18:00' },
    entry_fee: { local_adult: 200, local_child: 50, foreign_adult: 500, foreign_child: 250, currency: 'NPR' },
    accessibility_info: { wheelchair_accessible: false, parking: true, restrooms: true, guide_available: true },
    best_time_to_visit: 'October to November',
    average_visit_duration_minutes: 90,
    view_count: 1950,
    status: 'published',
    is_featured: true,
    created_at: '2024-01-05T12:15:00Z',
    updated_at: '2024-01-05T12:15:00Z',
    palika_name: 'Kathmandu Metropolitan',
    category_name: 'Heritage Site'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    palika_id: 2, // Kathmandu Metropolitan
    name_en: 'Boudhanath Stupa',
    name_ne: 'बौद्धनाथ स्तुप',
    slug: 'boudhanath-stupa',
    category_id: 1,
    site_type: 'stupa',
    heritage_status: 'world_heritage',
    ward_number: 11,
    address: 'Boudha, Kathmandu',
    location: { lat: 27.7214, lng: 85.3591 },
    short_description: 'One of the largest Buddhist stupas in the world and major pilgrimage site',
    short_description_ne: 'विश्वको सबैभन्दा ठूलो बौद्ध स्तुपहरू मध्ये एक र प्रमुख तীर्थस्थल',
    full_description: 'Boudhanath Stupa is a UNESCO World Heritage Site and center of Tibetan Buddhism in Nepal. The massive mandala-shaped structure is surrounded by prayer wheels and monasteries.',
    full_description_ne: 'बौद्धनाथ स्तुप नेपालमा तिब्बती बौद्ध धर्मको केन्द्र र युनेस्को विश्व सम्पदा स्थल हो।',
    opening_hours: { monday: '08:00-19:00', tuesday: '08:00-19:00', wednesday: '08:00-19:00', thursday: '08:00-19:00', friday: '08:00-19:00', saturday: '08:00-19:00', sunday: '08:00-19:00' },
    entry_fee: { local_adult: 0, local_child: 0, foreign_adult: 1000, foreign_child: 500, currency: 'NPR' },
    accessibility_info: { wheelchair_accessible: true, parking: true, restrooms: true, guide_available: true },
    best_time_to_visit: 'September to November',
    average_visit_duration_minutes: 120,
    view_count: 2300,
    status: 'published',
    is_featured: true,
    created_at: '2024-01-12T10:45:00Z',
    updated_at: '2024-01-12T10:45:00Z',
    palika_name: 'Kathmandu Metropolitan',
    category_name: 'Heritage Site'
  }
]

export class FakeHeritageSitesDatasource implements IHeritageSitesDatasource {
  private data: HeritageSite[] = JSON.parse(JSON.stringify(MOCK_SITES))
  private idCounter = Math.max(...this.data.map(s => parseInt(s.id))) + 1

  async getAll(filters?: HeritageSiteFilters, pagination?: PaginationParams) {
    const { page = 1, limit = 20 } = pagination || {}
    const offset = (page - 1) * limit

    let results = [...this.data]

    if (filters?.palika_id) {
      results = results.filter(s => s.palika_id === filters.palika_id)
    }
    if (filters?.category_id) {
      results = results.filter(s => s.category_id === filters.category_id)
    }
    if (filters?.heritage_status) {
      results = results.filter(s => s.heritage_status === filters.heritage_status)
    }
    if (filters?.status) {
      results = results.filter(s => s.status === filters.status)
    }
    if (filters?.is_featured !== undefined) {
      results = results.filter(s => s.is_featured === filters.is_featured)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        s =>
          s.name_en.toLowerCase().includes(q) ||
          s.name_ne.toLowerCase().includes(q) ||
          s.short_description?.toLowerCase().includes(q)
      )
    }

    const total = results.length
    const paginated = results
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)

    return { data: paginated, total, count: total }
  }

  async getById(id: string): Promise<HeritageSite | null> {
    return this.data.find(s => s.id === id) || null
  }

  async getBySlug(slug: string): Promise<HeritageSite | null> {
    return this.data.find(s => s.slug === slug) || null
  }

  async create(input: CreateHeritageSiteInput): Promise<HeritageSite> {
    // Validate required location field (matches DB constraint: NOT NULL)
    if (!input.latitude || !input.longitude) {
      throw new Error('Location (latitude and longitude) is required for heritage sites')
    }

    const slug = this.generateSlug(input.name_en)
    const newSite: HeritageSite = {
      id: String(this.idCounter++),
      palika_id: input.palika_id,
      name_en: input.name_en,
      name_ne: input.name_ne,
      slug,
      category_id: input.category_id,
      site_type: input.site_type,
      heritage_status: input.heritage_status,
      ward_number: input.ward_number,
      address: input.address,
      location: { lat: input.latitude, lng: input.longitude }, // REQUIRED
      short_description: input.short_description,
      short_description_ne: input.short_description_ne,
      full_description: input.full_description,
      full_description_ne: input.full_description_ne,
      opening_hours: input.opening_hours,
      entry_fee: input.entry_fee,
      accessibility_info: input.accessibility_info,
      audio_guide_url: input.audio_guide_url,
      languages_available: input.languages_available,
      best_time_to_visit: input.best_time_to_visit,
      average_visit_duration_minutes: input.average_visit_duration_minutes,
      view_count: 0,
      status: input.status || 'draft',
      is_featured: input.is_featured || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.data.push(newSite)
    return newSite
  }

  async update(id: string, input: Partial<CreateHeritageSiteInput>): Promise<HeritageSite> {
    const index = this.data.findIndex(s => s.id === id)
    if (index === -1) throw new Error('Heritage site not found')

    const existing = this.data[index]
    const updated: HeritageSite = {
      ...existing,
      ...input,
      id: existing.id,
      palika_id: input.palika_id ?? existing.palika_id,
      name_en: input.name_en ?? existing.name_en,
      name_ne: input.name_ne ?? existing.name_ne,
      category_id: input.category_id ?? existing.category_id,
      slug:
        input.name_en && input.name_en !== existing.name_en
          ? this.generateSlug(input.name_en)
          : existing.slug,
      location:
        input.latitude && input.longitude
          ? { lat: input.latitude, lng: input.longitude }
          : input.latitude === undefined && input.longitude === undefined
          ? existing.location
          : undefined,
      view_count: existing.view_count,
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    }

    this.data[index] = updated
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(s => s.id === id)
    if (index === -1) throw new Error('Heritage site not found')

    this.data.splice(index, 1)
    return true
  }

  async getFeatured(limit: number = 6): Promise<HeritageSite[]> {
    return this.data
      .filter(s => s.is_featured && s.status === 'published')
      .sort((a, b) => b.view_count - a.view_count)
      .slice(0, limit)
  }

  async getByPalika(palikaId: number, pagination?: PaginationParams) {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  async search(query: string, pagination?: PaginationParams) {
    return this.getAll({ search: query }, pagination)
  }

  async incrementViewCount(id: string): Promise<void> {
    const site = await this.getById(id)
    if (!site) throw new Error('Heritage site not found')

    site.view_count++
  }

  async toggleFeatured(id: string): Promise<HeritageSite> {
    const site = await this.getById(id)
    if (!site) throw new Error('Heritage site not found')

    return this.update(id, { is_featured: !site.is_featured } as any)
  }

  async publish(id: string): Promise<HeritageSite> {
    return this.update(id, { status: 'published' } as any)
  }

  async archive(id: string): Promise<HeritageSite> {
    return this.update(id, { status: 'archived' } as any)
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
}
