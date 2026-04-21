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
} from '@/lib/datasources/businesses-datasource'
import { getBusinessesDatasource } from '@/lib/datasources/businesses-config'
import { ServiceResponse } from './types'

export interface RegisterBusinessResult {
  business_id: string | undefined
  verification_status: string
  is_published: boolean
  message: string
  next_steps: string
}

export class BusinessesService {
  private datasource: IBusinessesDatasource

  constructor(datasource?: IBusinessesDatasource) {
    this.datasource = datasource ?? getBusinessesDatasource()
  }

  /** Register a business. Tier gating is intentionally absent — tier impact is a later dynamic-config concern. */
  async register(
    input: CreateBusinessInput
  ): Promise<
    ServiceResponse<RegisterBusinessResult> & {
      status?: number
    }
  > {
    try {
      if (
        !input.palika_id ||
        !input.business_name ||
        !input.contact_phone ||
        !input.address
      ) {
        return {
          success: false,
          error:
            'Missing required fields: palika_id, business_name, contact_phone, address',
          status: 400,
        }
      }

      const status = 'pending_review'
      const isPublished = false

      const created = await this.datasource.create({
        ...input,
        _status: status,
        _isPublished: isPublished,
      })

      return {
        success: true,
        data: {
          business_id: (created as any)?.id,
          verification_status: status,
          is_published: isPublished,
          message:
            'Your business has been submitted for review. You will be notified when it is approved.',
          next_steps:
            'Your submission is under review by Palika staff. This usually takes 3-5 business days.',
        },
        status: 201,
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create business registration'
      return { success: false, error: message, status: 500 }
    }
  }

  /** Paginated list of pending approvals with filters. */
  async getApprovals(
    filters: BusinessApprovalsFilters,
    pagination: BusinessApprovalsPagination
  ): Promise<ServiceResponse<BusinessApprovalsResult>> {
    try {
      const data = await this.datasource.getApprovals(filters, pagination)
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to fetch pending approvals'
      return { success: false, error: message }
    }
  }

  /** Full business detail with palika, images, notes, verification rules. */
  async getApprovalDetails(
    id: string
  ): Promise<ServiceResponse<BusinessApprovalDetails>> {
    try {
      const data = await this.datasource.getApprovalDetails(id)
      if (!data) {
        return { success: false, error: 'Business not found' }
      }
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch business'
      return { success: false, error: message }
    }
  }

  /** Append an internal review note to a business. */
  async addNote(
    businessId: string,
    input: AddNoteInput
  ): Promise<ServiceResponse<ApprovalNoteWithAuthor>> {
    try {
      if (!input.content || input.content.trim().length === 0) {
        return { success: false, error: 'Note content is required' }
      }
      if (input.content.length > 5000) {
        return {
          success: false,
          error: 'Note content cannot exceed 5000 characters',
        }
      }
      const business = await this.datasource.findById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }
      const data = await this.datasource.addNote(businessId, {
        ...input,
        content: input.content.trim(),
      })
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create approval note'
      return { success: false, error: message }
    }
  }

  /** List internal notes for a business. */
  async getNotes(
    businessId: string
  ): Promise<ServiceResponse<ApprovalNoteWithAuthor[]>> {
    try {
      const business = await this.datasource.findById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }
      const data = await this.datasource.getNotes(businessId)
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch approval notes'
      return { success: false, error: message }
    }
  }

  /** Update approval status (approve / reject / request_changes). */
  async updateApprovalStatus(
    businessId: string,
    input: ApprovalStatusInput
  ): Promise<ServiceResponse<ApprovalStatusResult>> {
    try {
      if (
        !input.status ||
        !['approved', 'rejected', 'request_changes'].includes(input.status)
      ) {
        return {
          success: false,
          error:
            'Invalid status. Must be approved, rejected, or request_changes',
        }
      }
      const business = await this.datasource.findById(businessId)
      if (!business) {
        return { success: false, error: 'Business not found' }
      }
      const data = await this.datasource.updateApprovalStatus(businessId, input)
      return { success: true, data }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update approval status'
      return { success: false, error: message }
    }
  }
}
