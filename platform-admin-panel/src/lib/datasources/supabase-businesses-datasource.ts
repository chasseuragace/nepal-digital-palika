import { SupabaseClient } from '@supabase/supabase-js'
import { Business } from '@/lib/types'
import {
  AddNoteInput,
  ApprovalNoteWithAuthor,
  ApprovalStatusInput,
  ApprovalStatusResult,
  BusinessApprovalDetails,
  BusinessApprovalsFilters,
  BusinessApprovalsPagination,
  BusinessApprovalsResult,
  CreateBusinessInput,
  IBusinessesDatasource,
} from './businesses-datasource'

/**
 * Supabase businesses datasource. Field mapping vs the platform API contract:
 *   API contact_phone       → DB phone
 *   API contact_email       → DB email
 *   API featured_image_url  → DB featured_image
 *   API category            → DB sub_category (label) + business_type_id (int FK → categories)
 *   API coordinates{lat,lng}→ DB location (geography Point, via PostGIS)
 *   API owner_info          → DB details (jsonb)
 *   contact_website, entity_type: not in schema; ignored.
 */
export class SupabaseBusinessesDatasource implements IBusinessesDatasource {
  constructor(private client: SupabaseClient) {}

  async create(input: CreateBusinessInput): Promise<Business> {
    const status = input._status ?? 'draft'
    const isPublished = input._isPublished ?? false

    // Required-field defaults (schema has NOT NULL on slug, business_type_id, ward_number, owner_user_id, description, location).
    const slug = `${toSlug(input.business_name)}-${Date.now().toString(36)}`
    const businessTypeId = (input as any).business_type_id
      ? Number((input as any).business_type_id)
      : await this.resolveDefaultCategoryId()
    const wardNumber = input.ward_number ?? 1
    const ownerId = (input as any).owner_user_id ?? (await this.resolveDefaultOwnerId())
    const description = input.description || input.business_name

    const locationWkt = input.coordinates
      ? `SRID=4326;POINT(${input.coordinates.lng} ${input.coordinates.lat})`
      : 'SRID=4326;POINT(0 0)'

    const row: Record<string, unknown> = {
      palika_id: input.palika_id,
      owner_user_id: ownerId,
      business_name: input.business_name,
      business_name_ne: input.business_name_ne || null,
      slug,
      business_type_id: businessTypeId,
      sub_category: input.category || null,
      phone: input.contact_phone,
      email: input.contact_email || null,
      ward_number: wardNumber,
      address: input.address,
      location: locationWkt,
      description,
      details: input.owner_info ?? null,
      operating_hours: input.operating_hours ?? undefined,
      is_24_7: input.is_24_7 || false,
      languages_spoken: input.languages_spoken || ['en', 'ne'],
      facilities: input.facilities ?? undefined,
      price_range: input.price_range ?? undefined,
      featured_image: null,
      status,
      verification_status: 'pending',
      is_published: isPublished,
      is_featured: false,
      view_count: 0,
    }

    const { data, error } = await this.client
      .from('businesses')
      .insert([row])
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message || 'Failed to create business registration')
    }
    return data as Business
  }

  async findById(id: string): Promise<Business | null> {
    const { data, error } = await this.client
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return data as Business
  }

  async getApprovals(
    filters: BusinessApprovalsFilters,
    pagination: BusinessApprovalsPagination
  ): Promise<BusinessApprovalsResult> {
    let query = this.client
      .from('businesses')
      .select(
        `
        id,
        business_name,
        business_name_ne,
        sub_category,
        palika_id,
        phone,
        email,
        status,
        verification_status,
        created_at,
        details,
        featured_image,
        palikas(id, name_en, name_ne)
      `,
        { count: 'exact' }
      )

    if (filters.palika_id) query = query.eq('palika_id', filters.palika_id)

    if (filters.status) {
      query = query.eq('status', filters.status)
    } else {
      query = query.in('status', ['pending_review', 'draft'])
    }

    if (filters.category) query = query.eq('sub_category', filters.category)
    if (filters.start_date) query = query.gte('created_at', filters.start_date)
    if (filters.end_date) query = query.lte('created_at', filters.end_date)
    if (filters.search) {
      query = query.or(
        `business_name.ilike.%${filters.search}%,business_name_ne.ilike.%${filters.search}%`
      )
    }

    const offset = (pagination.page - 1) * pagination.limit
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    const { data, error, count } = await query
    if (error) throw new Error(error.message || 'Failed to fetch approvals')

    const mapped = ((data as any[]) || []).map((b) => ({
      id: b.id,
      business_name: b.business_name,
      business_name_ne: b.business_name_ne,
      category: b.sub_category,
      palika_id: b.palika_id,
      contact_phone: b.phone,
      contact_email: b.email,
      status: b.status,
      verification_status: b.verification_status,
      created_at: b.created_at,
      owner_info: b.details,
      featured_image_url: b.featured_image,
      palikas: b.palikas,
    }))

    return { data: mapped as any, count: count || 0 }
  }

  async getApprovalDetails(
    id: string
  ): Promise<BusinessApprovalDetails | null> {
    const { data: business, error } = await this.client
      .from('businesses')
      .select(
        `
        *,
        palikas(id, name_en, name_ne, district_id),
        business_images(id, image_url, is_featured, sort_order),
        approval_notes(id, content, is_internal, created_at, author_id, admin_users(full_name))
      `
      )
      .eq('id', id)
      .single()

    if (error || !business) return null

    let verificationRules: any[] = []
    const { data: workflow } = await this.client
      .from('approval_workflows')
      .select('rules')
      .eq('palika_id', (business as any).palika_id)
      .maybeSingle()

    if (workflow?.rules && Array.isArray(workflow.rules)) {
      verificationRules = (workflow.rules as any[]).filter(
        (r: any) => r.enabled === true
      )
    }

    let district: unknown = null
    const palikaDistrictId = (business as any).palikas?.district_id
    if (palikaDistrictId) {
      const { data: d } = await this.client
        .from('districts')
        .select('id, name_en, name_ne')
        .eq('id', palikaDistrictId)
        .maybeSingle()
      district = d
    }

    const b = business as any
    return {
      id: b.id,
      business_name: b.business_name,
      business_name_ne: b.business_name_ne,
      business_type: null,
      category: b.sub_category,
      entity_type: null,
      contact_phone: b.phone,
      contact_email: b.email,
      contact_website: null,
      address: b.address,
      ward_number: b.ward_number,
      coordinates: null,
      location: b.location,
      description: b.description,
      description_ne: b.description_ne ?? null,
      operating_hours: b.operating_hours,
      is_24_7: b.is_24_7,
      languages_spoken: b.languages_spoken,
      price_range: b.price_range,
      facilities: b.facilities,
      status: b.status,
      verification_status: b.verification_status,
      reviewer_feedback: b.reviewer_feedback,
      reviewer_id: b.reviewer_id,
      is_published: b.is_published,
      created_at: b.created_at,
      created_by: b.created_by,
      updated_at: b.updated_at,
      owner_user_id: b.owner_user_id,
      owner_info: b.details,
      palika: b.palikas,
      district,
      images: b.business_images || [],
      featured_image_url: b.featured_image,
      approval_notes: b.approval_notes || [],
      verification_rules: verificationRules,
    }
  }

  async addNote(
    businessId: string,
    input: AddNoteInput
  ): Promise<ApprovalNoteWithAuthor> {
    const { data: note, error: noteError } = await this.client
      .from('approval_notes')
      .insert({
        business_id: businessId,
        content: input.content,
        is_internal: input.is_internal,
        author_id: input.author_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (noteError || !note) {
      throw new Error(noteError?.message || 'Failed to create approval note')
    }

    let authorName = 'Unknown'
    if ((note as any).author_id) {
      const { data: author } = await this.client
        .from('admin_users')
        .select('id, full_name')
        .eq('id', (note as any).author_id)
        .maybeSingle()
      if (author?.full_name) authorName = author.full_name
    }

    const n = note as any
    return {
      id: n.id,
      business_id: n.business_id,
      content: n.content,
      is_internal: n.is_internal,
      author_id: n.author_id,
      author_name: authorName,
      created_at: n.created_at,
      updated_at: n.updated_at ?? n.created_at,
    }
  }

  async getNotes(businessId: string): Promise<ApprovalNoteWithAuthor[]> {
    const { data: notes, error } = await this.client
      .from('approval_notes')
      .select(
        `
        id,
        business_id,
        content,
        is_internal,
        author_id,
        created_at,
        admin_users(full_name)
      `
      )
      .eq('business_id', businessId)
      .eq('is_internal', true)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message || 'Failed to fetch approval notes')

    return ((notes as any[]) || []).map((note: any) => ({
      id: note.id,
      business_id: note.business_id,
      content: note.content,
      is_internal: note.is_internal,
      author_id: note.author_id,
      author_name: note.admin_users?.full_name || 'Unknown',
      created_at: note.created_at,
      updated_at: note.updated_at ?? note.created_at,
    }))
  }

  async updateApprovalStatus(
    id: string,
    input: ApprovalStatusInput
  ): Promise<ApprovalStatusResult> {
    // verification_status schema enum: pending | verified | rejected | suspended
    let newVerificationStatus: string
    let isPublished: boolean
    let updatedStatus: string

    if (input.status === 'approved') {
      newVerificationStatus = 'verified'
      isPublished = true
      updatedStatus = 'approved'
    } else if (input.status === 'rejected') {
      newVerificationStatus = 'rejected'
      isPublished = false
      updatedStatus = 'rejected'
    } else {
      newVerificationStatus = 'pending'
      isPublished = false
      updatedStatus = 'pending_review'
    }

    const { error: updateError } = await this.client
      .from('businesses')
      .update({
        verification_status: newVerificationStatus,
        status: updatedStatus,
        is_published: isPublished,
        reviewer_feedback: input.reason || null,
        reviewer_id: input.reviewerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      throw new Error(updateError.message || 'Failed to update approval status')
    }

    return {
      verification_status: newVerificationStatus,
      status: updatedStatus,
      is_published: isPublished,
    }
  }

  private async resolveDefaultCategoryId(): Promise<number> {
    const { data } = await this.client
      .from('categories')
      .select('id')
      .eq('entity_type', 'business')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id as number
    throw new Error('No business category seeded. Seed the categories table first.')
  }

  private async resolveDefaultOwnerId(): Promise<string> {
    const { data } = await this.client
      .from('profiles')
      .select('id')
      .limit(1)
      .maybeSingle()
    if (data?.id) return data.id as string
    throw new Error('No profile rows to own a business. Seed profiles first.')
  }
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200)
}
