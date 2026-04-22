/**
 * Fake Blog Posts Datasource
 * Mock implementation for development/testing without Supabase
 */

import { BlogPost, BlogPostFilters, CreateBlogPostInput, PaginationParams } from '@/services/types'
import { IBlogPostsDatasource } from './blog-posts-datasource'

/**
 * Mock data grounded in Supabase schema:
 * - author_id: fake UUID admin user IDs
 * - palika_id: 1=Bhaktapur, 2=Kathmandu, 3=Lalitpur
 * - category: VARCHAR(100) - tourism related
 * - tags: TEXT[] array
 * - status: draft | published | archived
 * - view_count: INTEGER
 */
const MOCK_POSTS: BlogPost[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440001',
    palika_id: 2, // Kathmandu Metropolitan
    author_id: '880e8400-e29b-41d4-a716-446655440001', // Fake admin UUID
    title_en: 'Exploring the Temples of Kathmandu Valley',
    title_ne: 'काठमाडौँ उपत्यकाको मन्दिरहरु अन्वेषण गर्दै',
    slug: 'exploring-temples-kathmandu-valley',
    excerpt: 'A comprehensive guide to visiting the most important temples in Kathmandu Valley',
    excerpt_ne: 'काठमाडौँ उपत्यकाको सबैभन्दा महत्वपूर्ण मन्दिरहरु भ्रमण गर्ने एक संपूर्ण गाइड',
    content:
      'The Kathmandu Valley is home to some of the most sacred and architecturally significant temples in Nepal. From the ancient Pashupatinath Temple to the stunning Boudhanath Stupa, each site offers a unique glimpse into Nepal\'s rich religious and cultural heritage. This guide will help you navigate through these magnificent structures and understand their historical significance.',
    content_ne:
      'काठमाडौँ उपत्यका नेपालको सबैभन्दा पवित्र र वास्तुकलात्मक रूपमा महत्वपूर्ण मन्दिरहरुको घर हो। प्राचीन पशुपतिनाथ मन्दिरदेखि शानदार बौद्धनाथ स्तुपसम्म, प्रत्येक स्थान नेपालको समृद्ध धार्मिक र सांस्कृतिक विरासतमा अनौठो झलक प्रदान गर्छ।',
    featured_image: 'https://example.com/kathmandu-temples.jpg',
    category: 'Travel Guide',
    tags: ['temples', 'kathmandu', 'tourism', 'culture', 'heritage'],
    status: 'published',
    published_at: '2024-03-15T10:00:00Z',
    view_count: 342,
    created_at: '2024-03-15T09:30:00Z',
    updated_at: '2024-03-15T09:30:00Z',
    display_author_name: 'Ramesh Sharma',
    palika_name: 'Kathmandu Metropolitan'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440002',
    palika_id: 1, // Bhaktapur Metropolitan
    author_id: '880e8400-e29b-41d4-a716-446655440002',
    title_en: 'Traditional Pottery of Bhaktapur: A Living Heritage',
    title_ne: 'भक्तपुरको परम्परागत मृदा शिल्प: एक जीवन्त सम्पदा',
    slug: 'traditional-pottery-bhaktapur-heritage',
    excerpt: 'Discover the centuries-old pottery tradition that keeps Bhaktapur\'s culture alive',
    excerpt_ne: 'भक्तपुरको संस्कृतिलाई जीवन्त राखने सदीयौँ पुरानो मृदा शिल्प परम्परा खोज्नुहोस्',
    content:
      'Bhaktapur\'s pottery tradition dates back centuries and remains a vital part of the city\'s identity. Local artisans continue to handcraft beautiful ceramics using ancient techniques passed down through generations. The red clay of Bhaktapur produces unique pottery that is recognized throughout Nepal and beyond. Visitors can watch potters at work in Pottery Square and purchase authentic pieces directly from craftspeople.',
    content_ne:
      'भक्तपुरको मृदा शिल्प परम्परा सदीयौँ पहिलेदेखि हरेक र शहरको पहिचानको एक महत्वपूर्ण भाग बनी रहेको छ। स्थानीय शिल्पीहरु पुस्तागतबाट अनुगमन गरिने पुरानो प्रविधि प्रयोग गरी सुन्दर मृदा पात्र हस्तनिर्मित गर्न जारी राखेका छन्।',
    featured_image: 'https://example.com/bhaktapur-pottery.jpg',
    category: 'Culture & Heritage',
    tags: ['pottery', 'bhaktapur', 'artisan', 'culture', 'craft'],
    status: 'published',
    published_at: '2024-03-10T14:00:00Z',
    view_count: 215,
    created_at: '2024-03-10T13:30:00Z',
    updated_at: '2024-03-10T13:30:00Z',
    display_author_name: 'Anita Paudel',
    palika_name: 'Bhaktapur Metropolitan'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440003',
    palika_id: 3, // Lalitpur Metropolitan
    author_id: '880e8400-e29b-41d4-a716-446655440003',
    title_en: 'Best Time to Visit Nepal: A Seasonal Guide',
    title_ne: 'नेपाल भ्रमण गर्ने सबैभन्दा राम्रो समय: एक ऋतु गाइड',
    slug: 'best-time-visit-nepal-seasonal-guide',
    excerpt: 'Learn when to visit Nepal based on weather, festivals, and travel conditions',
    excerpt_ne: 'मौसम, पर्वहरु र यात्रा परिस्थितिको आधारमा नेपाल कहिले भ्रमण गर्ने सिक्नुहोस्',
    content:
      'Nepal offers unique experiences throughout the year, but the best time to visit depends on your interests and preferences. September to November (autumn) is considered the ideal season with clear skies, moderate temperatures, and vibrant festivals. December to February (winter) brings crisp air and excellent views of the Himalayan peaks. March to May (spring) showcases blooming rhododendrons and is perfect for trekking. June to August (monsoon) is less ideal for tourism but offers lush landscapes.',
    content_ne:
      'नेपाल वर्षभर अनौठो अनुभवहरु प्रदान गर्छ, तर सबैभन्दा राम्रो भ्रमण समय आपनो रुचि र पसन्दमा निर्भर गर्छ। सेप्टेम्बर देखि नोभेम्बर (शरद) सबैभन्दा आदर्श ऋतु माना गरिन्छ स्पष्ट आकाश, मध्यम तापमान र जीवन्त पर्वहरु सहित।',
    featured_image: 'https://example.com/nepal-seasons.jpg',
    category: 'Travel Advice',
    tags: ['seasons', 'weather', 'travel-planning', 'tourism', 'nepal'],
    status: 'published',
    published_at: '2024-02-28T11:00:00Z',
    view_count: 567,
    created_at: '2024-02-28T10:30:00Z',
    updated_at: '2024-02-28T10:30:00Z',
    display_author_name: 'Pradeep Magar',
    palika_name: 'Lalitpur Metropolitan'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440004',
    palika_id: 2, // Kathmandu Metropolitan
    author_id: '880e8400-e29b-41d4-a716-446655440001',
    title_en: 'Kathmandu Street Food: A Culinary Adventure',
    title_ne: 'काठमाडौँको सडक खाना: एक पाक कला अयोजन',
    slug: 'kathmandu-street-food-culinary-adventure',
    excerpt: 'Explore the delicious and diverse street food scene of Kathmandu',
    excerpt_ne: 'काठमाडौँको स्वादिष्ट र विविध सडक खाना दृश्य अन्वेषण गर्नुहोस्',
    content:
      'Kathmandu\'s street food culture is a vibrant tapestry of flavors, aromas, and culinary traditions. From the iconic momos (dumplings) to savory sekuwa (grilled meat skewers), every corner of the city offers culinary surprises. Don\'t miss the crispy samosas, steaming dal bhat (rice and lentils), and sweet juju dhau (rice pudding). Street food vendors in Thamel, Asan, and Basantapur offer authentic Nepali cuisine at affordable prices.',
    content_ne:
      'काठमाडौँको सडक खाना संस्कृति स्वाद, गन्ध र पाक कला परम्पराको एक जीवन्त बुनाई हो। मोमो (दम्पलिङ) दे लोभनीय सेक्वा (ग्रिल गरिएको मासु) सम्म, शहरको हरेक कोण पाक कला आश्चर्य प्रदान गर्छ।',
    featured_image: 'https://example.com/kathmandu-street-food.jpg',
    category: 'Food & Culture',
    tags: ['food', 'kathmandu', 'street-food', 'cuisine', 'dining'],
    status: 'published',
    published_at: '2024-03-05T12:30:00Z',
    view_count: 421,
    created_at: '2024-03-05T12:00:00Z',
    updated_at: '2024-03-05T12:00:00Z',
    display_author_name: 'Ramesh Sharma',
    palika_name: 'Kathmandu Metropolitan'
  },
  {
    id: '770e8400-e29b-41d4-a716-446655440005',
    palika_id: 1, // Bhaktapur Metropolitan
    author_id: '880e8400-e29b-41d4-a716-446655440002',
    title_en: 'Sustainable Tourism in Nepal: Preserving Our Heritage',
    title_ne: 'नेपालमा टिकाऊ पर्यटन: हाम्रो सम्पदा संरक्षण गर्दै',
    slug: 'sustainable-tourism-nepal-preserving-heritage',
    excerpt: 'How responsible travel practices can help protect Nepal\'s natural and cultural treasures',
    excerpt_ne: 'जिम्मेवार यात्रा अनुशीलन कसरी नेपालको प्राकृतिक र सांस्कृतिक खजानालाई रक्षा गर्न सक्छ',
    content:
      'As Nepal becomes an increasingly popular tourist destination, the need for sustainable tourism practices becomes ever more critical. Visitors can make a positive impact by supporting local businesses, respecting cultural traditions, minimizing environmental impact, and choosing eco-friendly accommodations and tours. By practicing responsible tourism, we can ensure that Nepal\'s pristine landscapes and rich cultural heritage are preserved for future generations.',
    content_ne:
      'जसरी नेपाल क्रमशः लोकप्रिय पर्यटन गन्तव्य बनिरहेको छ, टिकाऊ पर्यटन अनुशीलनको आवश्यकता अझै पनि महत्वपूर्ण बनिरहेको छ। यात्रीहरु स्थानीय व्यवसाय समर्थन गरी, सांस्कृतिक परम्पराको सम्मान गरी सकारात्मक प्रभाव पारन सक्छन्।',
    featured_image: 'https://example.com/sustainable-tourism.jpg',
    category: 'Sustainability',
    tags: ['sustainable-tourism', 'environment', 'conservation', 'travel-ethics', 'nepal'],
    status: 'draft',
    published_at: undefined,
    view_count: 0,
    created_at: '2024-04-01T15:00:00Z',
    updated_at: '2024-04-01T15:00:00Z',
    display_author_name: 'Anita Paudel',
    palika_name: 'Bhaktapur Metropolitan'
  }
]

export class FakeBlogPostsDatasource implements IBlogPostsDatasource {
  private data: BlogPost[] = JSON.parse(JSON.stringify(MOCK_POSTS))
  private idCounter = Math.max(...this.data.map(p => parseInt(p.id.split('-')[0], 16))) + 1

  async getAll(filters?: BlogPostFilters, pagination?: PaginationParams) {
    const { page = 1, limit = 20 } = pagination || {}
    const offset = (page - 1) * limit

    let results = [...this.data]

    if (filters?.palika_id) {
      results = results.filter(p => p.palika_id === filters.palika_id)
    }
    if (filters?.author_id) {
      results = results.filter(p => p.author_id === filters.author_id)
    }
    if (filters?.category) {
      results = results.filter(p => p.category === filters.category)
    }
    if (filters?.status) {
      results = results.filter(p => p.status === filters.status)
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(
        p =>
          p.title_en.toLowerCase().includes(q) ||
          p.title_ne.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q)
      )
    }
    if (filters?.tags && filters.tags.length > 0) {
      results = results.filter(p => filters.tags?.some(tag => p.tags?.includes(tag)))
    }

    const total = results.length
    const paginated = results
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)

    return { data: paginated, total, count: total }
  }

  async getById(id: string): Promise<BlogPost | null> {
    return this.data.find(p => p.id === id) || null
  }

  async getBySlug(slug: string): Promise<BlogPost | null> {
    return this.data.find(p => p.slug === slug) || null
  }

  async create(input: CreateBlogPostInput): Promise<BlogPost> {
    const slug = this.generateSlug(input.title_en)
    const newPost: BlogPost = {
      id: `770e8400-e29b-41d4-a716-${String(this.idCounter++).padStart(12, '0')}`,
      palika_id: input.palika_id,
      author_id: input.author_id,
      title_en: input.title_en,
      title_ne: input.title_ne,
      slug,
      excerpt: input.excerpt,
      excerpt_ne: input.excerpt_ne,
      content: input.content,
      content_ne: input.content_ne,
      featured_image: undefined,
      category: input.category,
      tags: input.tags,
      status: input.status || 'draft',
      published_at: undefined,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      display_author_name: input.display_author_name
    }

    this.data.push(newPost)
    return newPost
  }

  async update(id: string, input: Partial<CreateBlogPostInput>): Promise<BlogPost> {
    const index = this.data.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Blog post not found')

    const existing = this.data[index]
    const updated: BlogPost = {
      ...existing,
      ...input,
      id: existing.id,
      palika_id: input.palika_id ?? existing.palika_id,
      author_id: input.author_id ?? existing.author_id,
      title_en: input.title_en ?? existing.title_en,
      title_ne: input.title_ne ?? existing.title_ne,
      content: input.content ?? existing.content,
      slug:
        input.title_en && input.title_en !== existing.title_en
          ? this.generateSlug(input.title_en)
          : existing.slug,
      view_count: existing.view_count,
      created_at: existing.created_at,
      updated_at: new Date().toISOString()
    }

    this.data[index] = updated
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(p => p.id === id)
    if (index === -1) throw new Error('Blog post not found')

    this.data.splice(index, 1)
    return true
  }

  async getPublished(pagination?: PaginationParams) {
    return this.getAll({ status: 'published' }, pagination)
  }

  async getByAuthor(authorId: string, pagination?: PaginationParams) {
    return this.getAll({ author_id: authorId }, pagination)
  }

  async getByPalika(palikaId: number, pagination?: PaginationParams) {
    return this.getAll({ palika_id: palikaId }, pagination)
  }

  async getByCategory(category: string, pagination?: PaginationParams) {
    return this.getAll({ category }, pagination)
  }

  async getByTags(tags: string[], pagination?: PaginationParams) {
    return this.getAll({ tags }, pagination)
  }

  async search(query: string, pagination?: PaginationParams) {
    return this.getAll({ search: query }, pagination)
  }

  async publish(id: string): Promise<BlogPost> {
    const post = await this.getById(id)
    if (!post) throw new Error('Blog post not found')

    return this.update(id, { status: 'published' } as any)
  }

  async archive(id: string): Promise<BlogPost> {
    return this.update(id, { status: 'archived' } as any)
  }

  async incrementViewCount(id: string): Promise<void> {
    const post = await this.getById(id)
    if (!post) throw new Error('Blog post not found')

    post.view_count++
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
}
