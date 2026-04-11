/**
 * Fake Palika Profile Datasource
 * Mock implementation for development/testing without Supabase
 */

import { IPalikaProfileDatasource, PalikaProfile } from './palika-profile-datasource'

/**
 * Mock palika profiles data (keyed by palika_id)
 */
const MOCK_PROFILES: Record<number, PalikaProfile> = {
  1: {
    id: 'profile-1',
    palika_id: 1,
    description_en: 'Bhaktapur Metropolitan - A historic city known for pottery and traditional architecture',
    description_ne: 'भक्तपुर महानगरपालिका - मृदा शिल्प र परम्परागत वास्तुकलाको लागि प्रसिद्ध एक ऐतिहासिक शहर',
    featured_image: 'https://example.com/bhaktapur-featured.jpg',
    gallery_images: [
      'https://example.com/bhaktapur-1.jpg',
      'https://example.com/bhaktapur-2.jpg',
      'https://example.com/bhaktapur-3.jpg'
    ],
    highlights: [
      {
        title: 'Pottery Square',
        description: 'Traditional pottery crafting area where artisans work',
        image_url: 'https://example.com/pottery-square.jpg'
      },
      {
        title: 'Bhaktapur Durbar Square',
        description: 'Historic square with ancient temples and palaces',
        image_url: 'https://example.com/durbar-square.jpg'
      }
    ],
    tourism_info: {
      best_time_to_visit: 'October to November',
      accessibility: 'Well connected by road',
      languages: ['Nepali', 'English'],
      currency: 'NPR',
      image_url: 'https://example.com/tourism-info.jpg'
    },
    demographics: {
      population: 250000,
      area_sq_km: 119,
      established_year: 2064
    },
    videos: ['https://example.com/bhaktapur-video.mp4'],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  2: {
    id: 'profile-2',
    palika_id: 2,
    description_en: 'Kathmandu Metropolitan - The vibrant capital city with rich cultural heritage',
    description_ne: 'काठमाडौँ महानगरपालिका - समृद्ध सांस्कृतिक विरासत सहितको जीवन्त राजधानी शहर',
    featured_image: 'https://example.com/kathmandu-featured.jpg',
    gallery_images: [
      'https://example.com/kathmandu-1.jpg',
      'https://example.com/kathmandu-2.jpg'
    ],
    highlights: [
      {
        title: 'Pashupatinath Temple',
        description: 'One of the most sacred Hindu temples in Nepal',
        image_url: 'https://example.com/pashupatinath.jpg'
      }
    ],
    tourism_info: {
      best_time_to_visit: 'September to November',
      accessibility: 'Major transportation hub',
      languages: ['Nepali', 'English', 'Hindi'],
      currency: 'NPR'
    },
    demographics: {
      population: 1500000,
      area_sq_km: 395,
      established_year: 2064
    },
    videos: [],
    created_at: '2024-01-20T10:00:00Z',
    updated_at: '2024-01-20T10:00:00Z'
  },
  3: {
    id: 'profile-3',
    palika_id: 3,
    description_en: 'Lalitpur Metropolitan - Home of cultural treasures and fine arts',
    description_ne: 'ललितपुर महानगरपालिका - सांस्कृतिक खजाना र ललित कलाको घर',
    featured_image: 'https://example.com/lalitpur-featured.jpg',
    gallery_images: [
      'https://example.com/lalitpur-1.jpg'
    ],
    highlights: [],
    tourism_info: {
      best_time_to_visit: 'October to November',
      accessibility: 'Adjacent to Kathmandu',
      languages: ['Nepali', 'English'],
      currency: 'NPR'
    },
    demographics: {
      population: 600000,
      area_sq_km: 360,
      established_year: 2064
    },
    videos: [],
    created_at: '2024-02-01T10:00:00Z',
    updated_at: '2024-02-01T10:00:00Z'
  }
}

export class FakePalikaProfileDatasource implements IPalikaProfileDatasource {
  /**
   * Get palika profile by ID
   */
  async getByPalikaId(palikaId: number): Promise<PalikaProfile | null> {
    return MOCK_PROFILES[palikaId] || null
  }

  /**
   * Update palika profile
   */
  async update(palikaId: number, data: Partial<PalikaProfile>): Promise<PalikaProfile> {
    const profile = MOCK_PROFILES[palikaId]
    if (!profile) {
      throw new Error(`Profile for palika ${palikaId} not found`)
    }
    const updated = { ...profile, ...data, palika_id: palikaId }
    MOCK_PROFILES[palikaId] = updated
    return updated
  }

  /**
   * Create or update palika profile
   */
  async upsert(palikaId: number, data: Partial<PalikaProfile>): Promise<PalikaProfile> {
    if (MOCK_PROFILES[palikaId]) {
      return this.update(palikaId, data)
    }

    // Create new profile
    const newProfile: PalikaProfile = {
      id: `profile-${palikaId}`,
      palika_id: palikaId,
      description_en: data.description_en || '',
      description_ne: data.description_ne || '',
      featured_image: data.featured_image || '',
      gallery_images: data.gallery_images || [],
      highlights: data.highlights || [],
      tourism_info: data.tourism_info || { currency: 'NPR' },
      demographics: data.demographics || {},
      videos: data.videos || []
    }

    MOCK_PROFILES[palikaId] = newProfile
    return newProfile
  }
}
