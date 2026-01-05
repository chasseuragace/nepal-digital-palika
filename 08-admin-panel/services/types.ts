/**
 * Framework-agnostic type definitions for Nepal Tourism Platform
 * These types can be used in any React/TypeScript project
 */

// ============ Base Types ============
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============ Auth Types ============
export interface AdminUser {
  id: string
  email: string
  full_name: string
  full_name_ne?: string
  role: 'super_admin' | 'palika_admin' | 'moderator' | 'support'
  palika_id?: number
  permissions: string[]
  is_active: boolean
}

export interface AuthSession {
  user: AdminUser
  token: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

// ============ Heritage Site Types ============
export interface HeritageSite {
  id: string
  palika_id: number
  name_en: string
  name_ne: string
  slug: string
  category_id: number
  site_type?: string
  heritage_status?: 'world_heritage' | 'national' | 'provincial' | 'local' | 'proposed'
  ward_number?: number
  address?: string
  location?: { lat: number; lng: number }
  short_description?: string
  short_description_ne?: string
  full_description?: string
  full_description_ne?: string
  opening_hours?: Record<string, string>
  entry_fee?: EntryFee
  featured_image?: string
  images?: string[]
  audio_guide_url?: string
  accessibility_info?: AccessibilityInfo
  best_time_to_visit?: string
  average_visit_duration_minutes?: number
  qr_code_url?: string
  view_count: number
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  is_featured: boolean
  created_at: string
  updated_at: string
  // Joined fields
  palika_name?: string
  category_name?: string
}

export interface EntryFee {
  local_adult: number
  local_child: number
  foreign_adult: number
  foreign_child: number
  currency: string
}

export interface AccessibilityInfo {
  wheelchair_accessible: boolean
  parking: boolean
  restrooms: boolean
  guide_available: boolean
}

export interface HeritageSiteFilters {
  palika_id?: number
  category_id?: number
  heritage_status?: string
  status?: string
  is_featured?: boolean
  search?: string
}

export interface CreateHeritageSiteInput {
  name_en: string
  name_ne: string
  palika_id: number
  category_id: number
  site_type?: string
  heritage_status?: string
  ward_number?: number
  address?: string
  latitude?: number
  longitude?: number
  short_description?: string
  short_description_ne?: string
  full_description?: string
  full_description_ne?: string
  opening_hours?: Record<string, string>
  entry_fee?: EntryFee
  best_time_to_visit?: string
  average_visit_duration_minutes?: number
  status?: string
  is_featured?: boolean
}

// ============ Event Types ============
export interface Event {
  id: string
  palika_id: number
  name_en: string
  name_ne: string
  slug: string
  category_id?: number
  event_type?: string
  is_festival: boolean
  nepali_calendar_date?: string
  recurrence_pattern?: string
  start_date: string
  end_date: string
  location?: { lat: number; lng: number }
  venue_name?: string
  short_description?: string
  short_description_ne?: string
  full_description?: string
  full_description_ne?: string
  featured_image?: string
  images?: string[]
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  // Joined fields
  palika_name?: string
  category_name?: string
}

export interface EventFilters {
  palika_id?: number
  category_id?: number
  event_type?: string
  is_festival?: boolean
  status?: string
  start_date_from?: string
  start_date_to?: string
  search?: string
}

export interface CreateEventInput {
  name_en: string
  name_ne: string
  palika_id: number
  category_id?: number
  event_type?: string
  is_festival?: boolean
  nepali_calendar_date?: string
  recurrence_pattern?: string
  start_date: string
  end_date: string
  venue_name?: string
  short_description?: string
  short_description_ne?: string
  full_description?: string
  full_description_ne?: string
  status?: string
}

// ============ Blog Post Types ============
export interface BlogPost {
  id: string
  palika_id: number
  author_id: string
  title_en: string
  title_ne: string
  slug: string
  excerpt?: string
  excerpt_ne?: string
  content: string
  content_ne?: string
  featured_image?: string
  category?: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  published_at?: string
  view_count: number
  created_at: string
  updated_at: string
  // Joined fields
  author_name?: string
  palika_name?: string
}

export interface BlogPostFilters {
  palika_id?: number
  author_id?: string
  category?: string
  status?: string
  search?: string
  tags?: string[]
}

export interface CreateBlogPostInput {
  title_en: string
  title_ne: string
  palika_id: number
  author_id: string
  excerpt?: string
  excerpt_ne?: string
  content: string
  content_ne?: string
  category?: string
  tags?: string[]
  status?: string
}

// ============ Business Types ============
export interface Business {
  id: string
  palika_id: number
  owner_user_id: string
  business_name: string
  business_name_ne?: string
  slug: string
  business_type_id: number
  sub_category?: string
  phone: string
  email?: string
  ward_number: number
  address: string
  location: { lat: number; lng: number }
  description: string
  details?: Record<string, any>
  price_range?: PriceRange
  operating_hours?: Record<string, string>
  is_24_7: boolean
  languages_spoken?: string[]
  facilities?: BusinessFacilities
  featured_image?: string
  images?: string[]
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended'
  verified_at?: string
  view_count: number
  contact_count: number
  inquiry_count: number
  rating_average: number
  rating_count: number
  is_active: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
}

export interface PriceRange {
  min: number
  max: number
  currency: string
  unit: string
}

export interface BusinessFacilities {
  wifi: boolean
  parking: boolean
  restaurant: boolean
  guide_service: boolean
}

// ============ User/Profile Types ============
export interface UserProfile {
  id: string
  phone?: string
  name?: string
  profile_photo?: string
  user_type: 'resident' | 'tourist_domestic' | 'tourist_international' | 'business_owner' | 'admin'
  default_palika_id?: number
  preferences?: UserPreferences
  phone_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark'
  notifications: {
    emergency: boolean
    events: boolean
    tourism_updates: boolean
    business_announcements: boolean
  }
  quiet_hours: {
    enabled: boolean
    start: string
    end: string
  }
  offline_maps: boolean
  download_content: boolean
}

// ============ Analytics Types ============
export interface DashboardStats {
  heritage_sites: {
    total: number
    published: number
    draft: number
    featured: number
  }
  events: {
    total: number
    upcoming: number
    past: number
    festivals: number
  }
  blog_posts: {
    total: number
    published: number
    draft: number
  }
  businesses: {
    total: number
    verified: number
    pending: number
  }
  users: {
    total: number
    residents: number
    tourists: number
    business_owners: number
  }
  engagement: {
    total_views: number
    qr_scans: number
    inquiries: number
    reviews: number
  }
}

export interface ContentAnalytics {
  entity_type: 'heritage_site' | 'event' | 'blog_post' | 'business'
  entity_id: string
  view_count: number
  unique_visitors: number
  avg_time_spent: number
  bounce_rate: number
  period: string
}

export interface TrafficAnalytics {
  date: string
  visitors: number
  page_views: number
  unique_visitors: number
  bounce_rate: number
  avg_session_duration: number
  top_pages: { path: string; views: number }[]
  traffic_sources: { source: string; count: number }[]
  device_breakdown: { device: string; count: number }[]
  geographic_distribution: { country: string; count: number }[]
}

// ============ Inquiry Types ============
export interface Inquiry {
  id: string
  business_id: string
  user_id: string
  inquiry_code: string
  inquiry_data: Record<string, any>
  status: 'new' | 'contacted' | 'confirmed' | 'completed' | 'cancelled'
  confirmed_at?: string
  completed_at?: string
  estimated_revenue?: number
  actual_revenue?: number
  created_at: string
  updated_at: string
}

// ============ Review Types ============
export interface Review {
  id: string
  business_id: string
  user_id: string
  rating: number
  title?: string
  comment?: string
  owner_response?: string
  owner_responded_at?: string
  helpful_count: number
  is_approved: boolean
  created_at: string
  updated_at: string
  // Joined fields
  user_name?: string
  business_name?: string
}

// ============ Favorite Types ============
export interface Favorite {
  id: string
  user_id: string
  entity_type: 'heritage_site' | 'event' | 'business'
  entity_id: string
  created_at: string
}

// ============ Palika Types ============
export interface Palika {
  id: number
  district_id: number
  name_en: string
  name_ne: string
  type: 'municipality' | 'metropolitan' | 'sub_metropolitan'
  code: string
  office_phone?: string
  office_email?: string
  website?: string
  total_wards: number
  is_active: boolean
  created_at: string
}

// ============ Category Types ============
export interface Category {
  id: number
  palika_id?: number
  entity_type: 'heritage_site' | 'event' | 'business' | 'blog_post'
  name_en: string
  name_ne: string
  slug: string
  parent_id?: number
  description?: string
  icon_url?: string
  display_order: number
  is_active: boolean
}
