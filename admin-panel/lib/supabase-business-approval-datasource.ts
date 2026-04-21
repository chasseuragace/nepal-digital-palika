/**
 * Supabase Business Approval Datasource
 * Real implementation using Supabase database
 */

import { IBusinessApprovalDatasource, BusinessApprovalStatus } from './business-approval-datasource'
import { SupabaseClient } from '@supabase/supabase-js'

export class SupabaseBusinessApprovalDatasource implements IBusinessApprovalDatasource {
  constructor(private db: SupabaseClient) {}

  async verifyBusiness(businessId: string, palikaId: number, adminId: string, notes?: string): Promise<void> {
    // Verify business belongs to palika
    const { data: business, error: fetchError } = await this.db
      .from('businesses')
      .select('id, palika_id, business_name, sub_category')
      .eq('id', businessId)
      .eq('palika_id', palikaId)
      .single()

    if (fetchError || !business) {
      throw new Error('Business not found or does not belong to this palika')
    }

    // Update business status
    const { error: updateError } = await this.db
      .from('businesses')
      .update({
        verification_status: 'verified',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', businessId)
      .eq('palika_id', palikaId)

    if (updateError) {
      throw updateError
    }

    // Log the action
    await this.logApprovalAction({
      businessId,
      palikaId,
      adminId,
      action: 'verified',
      reason: notes,
    })
  }

  async rejectBusiness(businessId: string, palikaId: number, adminId: string, reason: string): Promise<void> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required')
    }

    // Verify business belongs to palika
    const { data: business, error: fetchError } = await this.db
      .from('businesses')
      .select('id, palika_id, business_name, sub_category')
      .eq('id', businessId)
      .eq('palika_id', palikaId)
      .single()

    if (fetchError || !business) {
      throw new Error('Business not found or does not belong to this palika')
    }

    // Update business status
    const { error: updateError } = await this.db
      .from('businesses')
      .update({
        verification_status: 'rejected',
        verified_by: adminId,
        verified_at: new Date().toISOString(),
        rejection_reason: reason,
      })
      .eq('id', businessId)
      .eq('palika_id', palikaId)

    if (updateError) {
      throw updateError
    }

    // Log the action
    await this.logApprovalAction({
      businessId,
      palikaId,
      adminId,
      action: 'rejected',
      reason,
    })
  }

  async getBusinessApprovalStatus(businessId: string, palikaId: number): Promise<BusinessApprovalStatus> {
    const { data: business, error } = await this.db
      .from('businesses')
      .select('id, verification_status, verified_by, verified_at, rejection_reason, business_name, sub_category')
      .eq('id', businessId)
      .eq('palika_id', palikaId)
      .single()

    if (error || !business) {
      throw new Error('Business not found')
    }

    return {
      id: business.id,
      verificationStatus: business.verification_status,
      verifiedBy: business.verified_by,
      verifiedAt: business.verified_at,
      rejectionReason: business.rejection_reason,
      businessName: business.business_name,
      category: business.sub_category,
    }
  }

  async getAdminName(adminId: string): Promise<string> {
    const { data: admin, error } = await this.db
      .from('admin_users')
      .select('full_name')
      .eq('id', adminId)
      .single()

    if (error || !admin) {
      return 'Unknown Admin'
    }

    return admin.full_name || 'Unknown Admin'
  }

  async logApprovalAction(params: {
    businessId: string
    palikaId: number
    adminId: string
    action: 'verified' | 'rejected'
    reason?: string
  }): Promise<void> {
    try {
      await this.db.from('audit_logs').insert({
        entity_type: 'business',
        entity_id: params.businessId,
        action: `business_${params.action}`,
        admin_id: params.adminId,
        palika_id: params.palikaId,
        details: {
          action: params.action,
          reason: params.reason,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.warn('Failed to log approval action:', error)
      // Don't throw - logging failure shouldn't block the approval
    }
  }

  async getPendingBusinesses(palikaId: number, limit: number = 50, offset: number = 0): Promise<{
    businesses: any[]
    total: number
    limit: number
    offset: number
  }> {
    const { data: businesses, error, count } = await this.db
      .from('businesses')
      .select('id, business_name, sub_category, verification_status, created_at', { count: 'exact' })
      .eq('palika_id', palikaId)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return {
      businesses: businesses || [],
      total: count || 0,
      limit,
      offset,
    }
  }

  async getBusinesses(
    palikaId: number,
    filters?: {
      status?: 'pending' | 'verified' | 'rejected' | 'suspended'
      category?: string
      search?: string
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    businesses: any[]
    total: number
    limit: number
    offset: number
  }> {
    let query = this.db
      .from('businesses')
      .select('id, business_name, sub_category, verification_status, verified_at, rejection_reason, created_at', { count: 'exact' })
      .eq('palika_id', palikaId)

    if (filters?.status) {
      query = query.eq('verification_status', filters.status)
    }

    if (filters?.category) {
      query = query.eq('sub_category', filters.category)
    }

    if (filters?.search) {
      query = query.ilike('business_name', `%${filters.search}%`)
    }

    const { data: businesses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw error
    }

    return {
      businesses: businesses || [],
      total: count || 0,
      limit,
      offset,
    }
  }

  async getBusinessVerificationStats(palikaId: number): Promise<{
    total: number
    pending: number
    verified: number
    rejected: number
    suspended: number
  }> {
    const { data: stats, error } = await this.db
      .from('businesses')
      .select('verification_status')
      .eq('palika_id', palikaId)

    if (error) {
      throw error
    }

    return {
      total: stats?.length || 0,
      pending: stats?.filter((s: any) => s.verification_status === 'pending').length || 0,
      verified: stats?.filter((s: any) => s.verification_status === 'verified').length || 0,
      rejected: stats?.filter((s: any) => s.verification_status === 'rejected').length || 0,
      suspended: stats?.filter((s: any) => s.verification_status === 'suspended').length || 0,
    }
  }
}
