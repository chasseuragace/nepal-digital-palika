/**
 * Fake Events Datasource
 * Mock implementation for development/testing without Supabase
 */

import { Event, EventFilters, CreateEventInput, PaginationParams } from '@/services/types'
import { IEventsDatasource } from './events-datasource'

/**
 * Mock data grounded in Supabase schema:
 * - Palikas: 1=Bhaktapur Metropolitan, 2=Kathmandu Metropolitan, 3=Lalitpur Metropolitan
 * - location: OPTIONAL (can be null, unlike heritage_sites)
 * - start_date, end_date: REQUIRED (DATE format: YYYY-MM-DD)
 * - status: draft | published | archived
 * - is_festival: boolean
 * - no ward_number
 * - no entry fees
 */
const MOCK_EVENTS: Event[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    palika_id: 2, // Kathmandu Metropolitan
    name_en: 'Dasain Festival 2024',
    name_ne: 'दशैँ पर्व २०२४',
    slug: 'dasain-festival-2024',
    category_id: 1,
    event_type: 'festival',
    is_festival: true,
    nepali_calendar_date: '2081-07-15',
    start_date: '2024-10-02',
    end_date: '2024-10-12',
    venue_name: 'Kathmandu Valley',
    location: { lat: 27.7172, lng: 85.324 },
    short_description: 'Major Hindu festival celebrating the victory of good over evil',
    short_description_ne: 'अच्छाइमाथी बुराइको जयको उदयापन गर्ने प्रमुख हिन्दु पर्व',
    full_description: 'Dasain is the longest and most important festival in Nepal. It celebrates the victory of goddess Durga over buffalo demon Mahishasur. The festival lasts 15 days with various rituals and celebrations.',
    full_description_ne: 'दशैँ नेपालको सबैभन्दा लामो र महत्वपूर्ण पर्व हो। यो देवी दुर्गाको महिषासुर माथि विजय मनाइन्छ।',
    featured_image: 'https://example.com/dasain.jpg',
    status: 'published',
    created_at: '2024-08-01T10:00:00Z',
    updated_at: '2024-08-01T10:00:00Z',
    palika_name: 'Kathmandu Metropolitan',
    category_name: 'Festival'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    palika_id: 1, // Bhaktapur Metropolitan
    name_en: 'Bhaktapur Pottery Workshop',
    name_ne: 'भक्तपुर मृदा शिल्प कार्यशाला',
    slug: 'bhaktapur-pottery-workshop',
    category_id: 2,
    event_type: 'workshop',
    is_festival: false,
    start_date: '2024-04-15',
    end_date: '2024-04-20',
    venue_name: 'Bhaktapur Pottery Square',
    location: { lat: 27.6717, lng: 85.4307 },
    short_description: 'Learn traditional Newari pottery techniques from master craftsmen',
    short_description_ne: 'मास्टर शिल्पीहरूबाट परम्परागत नेवारी मृदा शिल्प सिक्नुहोस्',
    full_description: 'This hands-on workshop teaches traditional pottery techniques used for centuries in Bhaktapur. Participants will work with clay and learn wheel throwing.',
    full_description_ne: 'यो व्यावहारिक कार्यशाला भक्तपुरमा सदीयौंदेखि प्रयोग हुने परम्परागत मृदा शिल्प सिखाउँछ।',
    status: 'published',
    created_at: '2024-03-10T14:30:00Z',
    updated_at: '2024-03-10T14:30:00Z',
    palika_name: 'Bhaktapur Metropolitan',
    category_name: 'Workshop'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    palika_id: 3, // Lalitpur Metropolitan
    name_en: 'Tihar Festival (Diwali)',
    name_ne: 'तिहार पर्व (दिवाली)',
    slug: 'tihar-festival-diwali',
    category_id: 1,
    event_type: 'festival',
    is_festival: true,
    nepali_calendar_date: '2081-08-15',
    start_date: '2024-11-01',
    end_date: '2024-11-05',
    venue_name: 'Lalitpur District',
    location: { lat: 27.6743, lng: 85.3244 },
    short_description: 'Festival of lights celebrated with oil lamps and colorful decorations',
    short_description_ne: 'तेलको दीप र रंगीन सजावटले मनाइने प्रकाशको पर्व',
    full_description: 'Tihar is celebrated for five days with oil lamps, flower garlands, and traditional sweets. The festival honors the relationship between humans and animals.',
    full_description_ne: 'तिहार पाँच दिन तेलको दीप, फूलको माला र परम्परागत मिठाईले मनाइन्छ।',
    featured_image: 'https://example.com/tihar.jpg',
    status: 'published',
    created_at: '2024-08-15T09:00:00Z',
    updated_at: '2024-08-15T09:00:00Z',
    palika_name: 'Lalitpur Metropolitan',
    category_name: 'Festival'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440004',
    palika_id: 2, // Kathmandu Metropolitan
    name_en: 'Cultural Walk Through Thamel',
    name_ne: 'थामेल हिँड़ाइ सांस्कृतिक भ्रमण',
    slug: 'cultural-walk-thamel',
    category_id: 2,
    event_type: 'tour',
    is_festival: false,
    start_date: '2024-04-25',
    end_date: '2024-04-25',
    venue_name: 'Thamel, Kathmandu',
    location: { lat: 27.7176, lng: 85.3004 },
    short_description: 'Guided walking tour exploring the cultural heritage of Thamel neighborhood',
    short_description_ne: 'थामेल इलाकाको सांस्कृतिक सम्पदा अन्वेषण गर्ने गाइडेड हिँड़ाइ',
    full_description: 'A 3-hour guided walking tour through the historic Thamel district. Visit ancient temples, local shops, and learn about Kathmandu Valley\'s diverse culture.',
    full_description_ne: 'थामेल जिल्लाको एक ३ घण्टे गाइडेड हिँड़ाइ। पुरानो मन्दिरहरू भ्रमण गर्नुहोस्।',
    status: 'published',
    created_at: '2024-03-20T11:15:00Z',
    updated_at: '2024-03-20T11:15:00Z',
    palika_name: 'Kathmandu Metropolitan',
    category_name: 'Tour'
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440005',
    palika_id: 1, // Bhaktapur Metropolitan
    name_en: 'Traditional Music Evening',
    name_ne: 'परम्परागत संगीत साँझ',
    slug: 'traditional-music-evening',
    category_id: 2,
    event_type: 'performance',
    is_festival: false,
    start_date: '2024-05-10',
    end_date: '2024-05-10',
    venue_name: 'Durbar Square, Bhaktapur',
    location: { lat: 27.6717, lng: 85.4307 },
    short_description: 'Evening of classical Nepali music and traditional dance performances',
    short_description_ne: 'शास्त्रीय नेपाली संगीत र परम्परागत नृत्य प्रदर्शन',
    full_description: 'Experience the magic of classical Nepali musical instruments including the sarangi and madal. Local artists will perform traditional dances.',
    full_description_ne: 'साराङ्गी र मदल सहित शास्त्रीय नेपाली वाद्य यंत्र अनुभव गर्नुहोस्।',
    status: 'draft',
    created_at: '2024-04-01T15:45:00Z',
    updated_at: '2024-04-01T15:45:00Z',
    palika_name: 'Bhaktapur Metropolitan',
    category_name: 'Performance'
  }
]

export class FakeEventsDatasource implements IEventsDatasource {
  private data: Event[] = JSON.parse(JSON.stringify(MOCK_EVENTS))
  private idCounter = Math.max(...this.data.map(e => parseInt(e.id.split('-')[0], 16))) + 1

  async getAll(filters?: EventFilters, pagination?: PaginationParams) {
    const { page = 1, limit = 20 } = pagination || {}
    const offset = (page - 1) * limit

    let results = [...this.data]

    if (filters?.palika_id) {
      results = results.filter(e => e.palika_id === filters.palika_id)
    }
    if (filters?.category_id) {
      results = results.filter(e => e.category_id === filters.category_id)
    }
    if (filters?.event_type) {
      results = results.filter(e => e.event_type === filters.event_type)
    }
    if (filters?.is_festival !== undefined) {
      results = results.filter(e => e.is_festival === filters.is_festival)
    }
    if (filters?.status) {
      results = results.filter(e => e.status === filters.status)
    }
    if (filters?.start_date_from) {
      results = results.filter(e => e.start_date >= filters.start_date_from!)
    }
    if (filters?.start_date_to) {
      results = results.filter(e => e.start_date <= filters.start_date_to!)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        e =>
          e.name_en.toLowerCase().includes(q) ||
          e.name_ne.toLowerCase().includes(q) ||
          e.short_description?.toLowerCase().includes(q)
      )
    }

    const total = results.length
    const paginated = results
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(offset, offset + limit)

    return { data: paginated, total, count: total }
  }

  async getById(id: string): Promise<Event | null> {
    return this.data.find(e => e.id === id) || null
  }

  async getBySlug(slug: string): Promise<Event | null> {
    return this.data.find(e => e.slug === slug) || null
  }

  async create(input: CreateEventInput): Promise<Event> {
    if (!input.start_date || !input.end_date) {
      throw new Error('Start date and end date are required for events')
    }

    const slug = this.generateSlug(input.name_en)
    const newEvent: Event = {
      id: `660e8400-e29b-41d4-a716-${String(this.idCounter++).padStart(12, '0')}`,
      palika_id: input.palika_id,
      name_en: input.name_en,
      name_ne: input.name_ne,
      slug,
      category_id: input.category_id,
      event_type: input.event_type,
      is_festival: input.is_festival || false,
      nepali_calendar_date: input.nepali_calendar_date,
      recurrence_pattern: input.recurrence_pattern,
      start_date: input.start_date,
      end_date: input.end_date,
      venue_name: input.venue_name,
      short_description: input.short_description,
      short_description_ne: input.short_description_ne,
      full_description: input.full_description,
      full_description_ne: input.full_description_ne,
      status: input.status || 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.data.push(newEvent)
    return newEvent
  }

  async update(id: string, input: Partial<CreateEventInput>): Promise<Event> {
    const index = this.data.findIndex(e => e.id === id)
    if (index === -1) throw new Error('Event not found')

    const existing = this.data[index]
    const updated: Event = {
      ...existing,
      ...input,
      id: existing.id,
      palika_id: input.palika_id ?? existing.palika_id,
      name_en: input.name_en ?? existing.name_en,
      name_ne: input.name_ne ?? existing.name_ne,
      category_id: input.category_id ?? existing.category_id,
      start_date: input.start_date ?? existing.start_date,
      end_date: input.end_date ?? existing.end_date,
      slug:
        input.name_en && input.name_en !== existing.name_en
          ? this.generateSlug(input.name_en)
          : existing.slug,
      is_festival: input.is_festival ?? existing.is_festival,
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    }

    this.data[index] = updated
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(e => e.id === id)
    if (index === -1) throw new Error('Event not found')

    this.data.splice(index, 1)
    return true
  }

  async getUpcoming(limit: number = 10): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0]

    return this.data
      .filter(e => e.start_date >= today && e.status === 'published')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, limit)
  }

  async getByPalika(palikaId: number, pagination?: PaginationParams) {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  async getFestivals(palikaId?: number): Promise<Event[]> {
    let results = this.data.filter(e => e.is_festival && e.status === 'published')

    if (palikaId) {
      results = results.filter(e => e.palika_id === palikaId)
    }

    return results.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }

  async search(query: string, pagination?: PaginationParams) {
    return this.getAll({ search: query }, pagination)
  }

  async publish(id: string): Promise<Event> {
    return this.update(id, { status: 'published' } as any)
  }

  async archive(id: string): Promise<Event> {
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
