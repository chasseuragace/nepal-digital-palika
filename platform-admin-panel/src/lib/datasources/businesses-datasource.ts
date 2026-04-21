import {
  Business,
  ApprovalNote,
  BusinessImage,
  ApprovalRule,
} from '@/lib/types'

export interface CreateBusinessInput {
  palika_id: number
  business_name: string
  business_name_ne?: string
  business_type?: string
  category?: string
  entity_type?: string
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
  price_range?: { min: number; max: number }
  facilities?: Record<string, boolean>
  owner_info?: Record<string, any>
  // Runtime-derived flags (set by service based on palika tier features)
  _status?: 'pending_review' | 'draft'
  _isPublished?: boolean
}

export interface BusinessApprovalsFilters {
  palika_id?: number
  status?: 'pending_review' | 'approved' | 'rejected' | 'draft'
  category?: string
  search?: string
  start_date?: string
  end_date?: string
}

export interface BusinessApprovalsPagination {
  page: number
  limit: number
}

export interface BusinessApprovalsResult {
  data: any[]
  count: number
}

export interface BusinessApprovalDetails {
  id: string
  business_name: string
  business_name_ne?: string | null
  business_type?: string | null
  category?: string | null
  entity_type?: string | null
  contact_phone: string
  contact_email?: string | null
  contact_website?: string | null
  address: string
  ward_number?: number | null
  coordinates?: any
  location?: any
  description?: string | null
  description_ne?: string | null
  operating_hours?: any
  is_24_7?: boolean | null
  languages_spoken?: string[] | null
  price_range?: any
  facilities?: any
  status: string
  verification_status: string
  reviewer_feedback?: string | null
  reviewer_id?: string | null
  is_published: boolean
  created_at: string
  created_by?: string | null
  updated_at: string
  owner_user_id?: string | null
  owner_info?: any
  palika?: any
  district?: any
  images: BusinessImage[]
  featured_image_url?: string | null
  approval_notes: Array<any>
  verification_rules: ApprovalRule[]
}

export interface ApprovalStatusInput {
  status: 'approved' | 'rejected' | 'request_changes'
  reason?: string
  reviewerId: string | null
}

export interface ApprovalStatusResult {
  verification_status: string
  status: string
  is_published: boolean
}

export interface AddNoteInput {
  content: string
  is_internal: boolean
  author_id: string | null
}

export interface ApprovalNoteWithAuthor extends ApprovalNote {
  author_name: string
}

export interface IBusinessesDatasource {
  /** Insert a new business; returns created record (may be partial). */
  create(input: CreateBusinessInput): Promise<Business>

  /** Fetch business by id, or null if not found. */
  findById(id: string): Promise<Business | null>

  /** Paginated list of businesses for approval workflow with filters. */
  getApprovals(
    filters: BusinessApprovalsFilters,
    pagination: BusinessApprovalsPagination
  ): Promise<BusinessApprovalsResult>

  /** Full business detail including palika, images, notes, verification rules. */
  getApprovalDetails(id: string): Promise<BusinessApprovalDetails | null>

  /** Append a note; returns created note joined with author name. */
  addNote(
    businessId: string,
    input: AddNoteInput
  ): Promise<ApprovalNoteWithAuthor>

  /** List internal notes for a business, newest first. */
  getNotes(businessId: string): Promise<ApprovalNoteWithAuthor[]>

  /** Update verification/publish status and write audit log. */
  updateApprovalStatus(
    id: string,
    input: ApprovalStatusInput
  ): Promise<ApprovalStatusResult>
}
