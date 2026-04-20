/**
 * Abstract Categories Datasource
 * Defines contract for querying categories
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

export interface Category {
  id: string
  name: string
  name_ne: string
  slug: string
  entity_type: string
  display_order?: number
  is_active?: boolean
}

export interface CategoriesFilter {
  entity_type?: string
  is_active?: boolean
}

export interface ICategoriesDatasource {
  // Get all categories with optional filtering
  getAll(filter?: CategoriesFilter): Promise<Category[]>

  // Get categories by entity type
  getByEntityType(entityType: string): Promise<Category[]>

  // Get a single category by ID
  getById(id: string): Promise<Category | null>

  // Get a category by slug
  getBySlug(slug: string): Promise<Category | null>

  // Create a new category
  create(category: Omit<Category, 'id'>): Promise<Category>

  // Update an existing category
  update(id: string, category: Partial<Category>): Promise<Category>

  // Delete a category
  delete(id: string): Promise<boolean>
}
