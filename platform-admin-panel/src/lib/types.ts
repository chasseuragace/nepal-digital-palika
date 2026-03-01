// Admin User Types
export interface AdminUser {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'super_admin' | 'province_admin' | 'district_admin' | 'palika_admin' | 'moderator' | 'support_agent'
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  province_id?: number
  district_id?: number
  palika_id?: number
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
}

// Role Types
export interface Role {
  id: number
  name: string
  description: string
  description_ne?: string
  created_at: string
}

// Permission Types
export interface Permission {
  id: number
  name: string
  description: string
  description_ne?: string
  resource: string
  action: string
  created_at: string
}

// Geographic Types
export interface Province {
  id: number
  name_en: string
  name_ne: string
  code: string
  created_at: string
}

export interface District {
  id: number
  province_id: number
  name_en: string
  name_ne: string
  code: string
  created_at: string
}

export interface Palika {
  id: number
  district_id: number
  name_en: string
  name_ne: string
  type: 'municipality' | 'metropolitan' | 'sub_metropolitan'
  code: string
  total_wards: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Admin Region Types
export interface AdminRegion {
  id: number
  admin_id: string
  region_type: 'province' | 'district' | 'palika'
  region_id: number
  assigned_at: string
  assigned_by?: string
}

// Audit Log Types
export interface AuditLog {
  id: number
  admin_id: string
  action: string
  entity_type: string
  entity_id?: string
  changes?: Record<string, any>
  created_at: string
}

// Dashboard Stats
export interface DashboardStats {
  total_admins: number
  active_admins: number
  total_roles: number
  total_permissions: number
  total_provinces: number
  total_districts: number
  total_palikas: number
  pending_approvals: number
}

// ============================================================
// TIER-BASED FEATURE GATING TYPES
// ============================================================

// Subscription Tier Types
export interface SubscriptionTier {
  id: string
  name: 'basic' | 'tourism' | 'premium'
  display_name: string
  description?: string
  cost_per_month: number
  cost_per_year: number
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// Feature Types
export interface Feature {
  id: string
  code: string
  display_name: string
  description?: string
  category: 'registration' | 'contact' | 'qr' | 'content' | 'emergency' | 'analytics' | 'admin'
  is_active: boolean
  created_at: string
}

// Tier-Feature Mapping
export interface TierFeature {
  tier_id: string
  feature_id: string
  enabled: boolean
  unlocked_at_version?: string
  created_at: string
}

// Palika with Tier Info
export interface PalikaWithTier extends Palika {
  subscription_tier_id?: string
  subscription_tier?: SubscriptionTier
  features?: Feature[]
  tier_assigned_at?: string
  tier_assigned_by?: string
}

// Tier Assignment Log
export interface TierAssignmentLog {
  id: string
  palika_id: number
  old_tier_id?: string
  new_tier_id: string
  assigned_by?: string
  reason?: string
  created_at: string
}

// ============================================================
// BUSINESS REGISTRATION TYPES
// ============================================================

// Business Entity
export interface Business {
  id: string
  palika_id: number
  owner_user_id?: string
  business_name: string
  business_name_ne?: string
  business_type?: string
  category?: string
  entity_type?: 'homestay' | 'producer' | 'artisan' | 'service'
  contact_phone: string
  contact_email?: string
  contact_website?: string
  address: string
  ward_number?: number
  coordinates?: { lat: number; lng: number }
  description?: string
  description_ne?: string
  operating_hours?: Record<string, string>
  is_24_7?: boolean
  languages_spoken?: string[]
  featured_image_url?: string
  images?: string[]
  price_range?: { min: number; max: number }
  facilities?: Record<string, boolean>
  owner_info?: Record<string, any>
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived'
  verification_status: 'pending' | 'approved' | 'rejected'
  reviewer_feedback?: string
  reviewer_id?: string
  is_published: boolean
  is_featured: boolean
  view_count: number
  created_at: string
  created_by?: string
  updated_at: string
  updated_by?: string
  published_at?: string
}

// Business Registration Form Data
export interface BusinessRegistrationForm {
  // Step 1: Basic Info
  business_name: string
  business_name_ne?: string
  business_type: string
  category?: string
  entity_type?: 'homestay' | 'producer' | 'artisan' | 'service'

  // Step 2: Contact
  contact_phone: string
  contact_email?: string
  contact_website?: string

  // Step 3: Location
  address: string
  ward_number?: number
  coordinates?: { lat: number; lng: number }

  // Step 4: Details
  description: string
  description_ne?: string
  operating_hours?: Record<string, string>
  is_24_7?: boolean
  languages_spoken?: string[]
  price_range?: { min: number; max: number }
  facilities?: Record<string, boolean>

  // Step 5: Media
  featured_image_url?: string
  images?: string[]
}

// Business Submission Response
export interface BusinessSubmissionResponse {
  success: boolean
  business_id?: string
  verification_status: 'pending' | 'published'
  message: string
  next_steps: string
}

// Business Image
export interface BusinessImage {
  id: string
  business_id: string
  image_url: string
  is_featured: boolean
  sort_order: number
  created_at: string
}

// ============================================================
// BUSINESS APPROVAL TYPES
// ============================================================

// Business Approval Details
export interface BusinessApprovalDetails extends Business {
  internal_notes?: ApprovalNote[]
  custom_rules?: ApprovalRule[]
  approval_workflow?: ApprovalWorkflow
}

// Approval Status Change
export interface ApprovalStatusChange {
  previous_status: string
  new_status: string
  changed_by?: AdminUser
  reason?: string
  created_at: string
}

// Approval Note
export interface ApprovalNote {
  id: string
  business_id: string
  content: string
  is_internal: boolean
  author_id?: string
  author?: AdminUser
  created_at: string
  updated_at: string
}

// Approval Workflow
export interface ApprovalWorkflow {
  id: string
  palika_id: number
  rules: ApprovalRule[]
  sla_days?: number
  auto_approve_after_days?: number
  requires_supervisor_review: boolean
  settings?: Record<string, any>
  created_at: string
  updated_at: string
  updated_by?: string
}

// Approval Rule
export interface ApprovalRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  order: number
  rule_type: 'data_quality' | 'compliance' | 'safety' | 'custom'
}
