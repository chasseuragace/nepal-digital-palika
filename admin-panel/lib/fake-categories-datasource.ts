/**
 * Fake Categories Datasource
 * Mock implementation for development/testing without Supabase
 */

import { Category, CategoriesFilter, ICategoriesDatasource } from './categories-datasource'

/**
 * Mock data grounded in Supabase schema:
 * - Categories table with entity_type filtering
 * - Event categories: Festival, Cultural, Sports, Religious, Food, Music, Educational
 * - Business categories: Accommodation, Restaurant, Shop, etc.
 * - Heritage site categories: Temple, Monastery, Palace, etc.
 */
const MOCK_CATEGORIES: Category[] = [
  // Event categories
  {
    id: '1',
    name: 'Festival',
    name_ne: 'चाड पर्व',
    slug: 'festival',
    entity_type: 'event',
    display_order: 1,
    is_active: true
  },
  {
    id: '2',
    name: 'Cultural',
    name_ne: 'सांस्कृतिक',
    slug: 'cultural',
    entity_type: 'event',
    display_order: 2,
    is_active: true
  },
  {
    id: '3',
    name: 'Sports',
    name_ne: 'खेलकुद',
    slug: 'sports',
    entity_type: 'event',
    display_order: 3,
    is_active: true
  },
  {
    id: '4',
    name: 'Religious',
    name_ne: 'धार्मिक',
    slug: 'religious',
    entity_type: 'event',
    display_order: 4,
    is_active: true
  },
  {
    id: '5',
    name: 'Food',
    name_ne: 'खाना',
    slug: 'food',
    entity_type: 'event',
    display_order: 5,
    is_active: true
  },
  {
    id: '6',
    name: 'Music',
    name_ne: 'संगीत',
    slug: 'music',
    entity_type: 'event',
    display_order: 6,
    is_active: true
  },
  {
    id: '7',
    name: 'Educational',
    name_ne: 'शैक्षिक',
    slug: 'educational',
    entity_type: 'event',
    display_order: 7,
    is_active: true
  },
  // Heritage site categories
  {
    id: '8',
    name: 'Temple',
    name_ne: 'मन्दिर',
    slug: 'temple',
    entity_type: 'heritage_site',
    display_order: 1,
    is_active: true
  },
  {
    id: '9',
    name: 'Monastery',
    name_ne: 'गुम्बा',
    slug: 'monastery',
    entity_type: 'heritage_site',
    display_order: 2,
    is_active: true
  },
  {
    id: '10',
    name: 'Palace',
    name_ne: 'दरबार',
    slug: 'palace',
    entity_type: 'heritage_site',
    display_order: 3,
    is_active: true
  },
  {
    id: '11',
    name: 'Stupa',
    name_ne: 'स्तूप',
    slug: 'stupa',
    entity_type: 'heritage_site',
    display_order: 4,
    is_active: true
  },
  // Business categories
  {
    id: '12',
    name: 'Accommodation',
    name_ne: 'बास स्थान',
    slug: 'accommodation',
    entity_type: 'business',
    display_order: 1,
    is_active: true
  },
  {
    id: '13',
    name: 'Restaurant',
    name_ne: 'रेस्टुरेन्ट',
    slug: 'restaurant',
    entity_type: 'business',
    display_order: 2,
    is_active: true
  },
  {
    id: '14',
    name: 'Shop',
    name_ne: 'दोकान',
    slug: 'shop',
    entity_type: 'business',
    display_order: 3,
    is_active: true
  },
  {
    id: '15',
    name: 'Tour Operator',
    name_ne: 'ट्रिप अपरेटर',
    slug: 'tour-operator',
    entity_type: 'business',
    display_order: 4,
    is_active: true
  }
]

export class FakeCategoriesDatasource implements ICategoriesDatasource {
  private data: Category[] = JSON.parse(JSON.stringify(MOCK_CATEGORIES))
  private idCounter = Math.max(...this.data.map(c => parseInt(c.id))) + 1

  async getAll(filter?: CategoriesFilter): Promise<Category[]> {
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulate network delay

    let results = [...this.data]

    if (filter?.entity_type) {
      results = results.filter(c => c.entity_type === filter.entity_type)
    }

    if (filter?.is_active !== undefined) {
      results = results.filter(c => c.is_active === filter.is_active)
    }

    // Sort by display_order, then by name
    results.sort((a, b) => {
      if (a.display_order !== undefined && b.display_order !== undefined) {
        return a.display_order - b.display_order
      }
      return a.name.localeCompare(b.name)
    })

    return results
  }

  async getByEntityType(entityType: string): Promise<Category[]> {
    return this.getAll({ entity_type: entityType })
  }

  async getById(id: string): Promise<Category | null> {
    await new Promise(resolve => setTimeout(resolve, 50))
    return this.data.find(c => c.id === id) || null
  }

  async getBySlug(slug: string): Promise<Category | null> {
    await new Promise(resolve => setTimeout(resolve, 50))
    return this.data.find(c => c.slug === slug) || null
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const newCategory: Category = {
      ...category,
      id: String(this.idCounter++)
    }

    this.data.push(newCategory)
    return newCategory
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const index = this.data.findIndex(c => c.id === id)
    if (index === -1) {
      throw new Error(`Category with id ${id} not found`)
    }

    this.data[index] = { ...this.data[index], ...category }
    return this.data[index]
  }

  async delete(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const index = this.data.findIndex(c => c.id === id)
    if (index === -1) {
      return false
    }

    this.data.splice(index, 1)
    return true
  }
}
