/**
 * Fake Business Approval Datasource
 * Mock implementation for development and testing
 * Returns hardcoded data without database calls
 */

import { IBusinessApprovalDatasource, BusinessApprovalStatus } from './business-approval-datasource'

export class FakeBusinessApprovalDatasource implements IBusinessApprovalDatasource {
  private businesses: any[] = [
    { id: 'fake-biz-1', palika_id: 1, name: 'Mountain View Hotel', category: 'Hotel', verification_status: 'pending' },
    { id: 'fake-biz-2', palika_id: 1, name: 'Local Restaurant', category: 'Restaurant', verification_status: 'pending' },
    { id: 'fake-biz-3', palika_id: 1, name: 'Adventure Trekking', category: 'Tour Operator', verification_status: 'verified' },
  ]

  async verifyBusiness(businessId: string, palikaId: number, adminId: string, notes?: string): Promise<void> {
    await this.delay(100)
    const business = this.businesses.find(b => b.id === businessId && b.palika_id === palikaId)
    if (!business) {
      throw new Error('Business not found or does not belong to this palika')
    }
    business.verification_status = 'verified'
    business.verified_by = adminId
    business.verified_at = new Date().toISOString()
    business.rejection_reason = null
  }

  async rejectBusiness(businessId: string, palikaId: number, adminId: string, reason: string): Promise<void> {
    await this.delay(100)
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required')
    }
    const business = this.businesses.find(b => b.id === businessId && b.palika_id === palikaId)
    if (!business) {
      throw new Error('Business not found or does not belong to this palika')
    }
    business.verification_status = 'rejected'
    business.verified_by = adminId
    business.verified_at = new Date().toISOString()
    business.rejection_reason = reason
  }

  async getBusinessApprovalStatus(businessId: string, palikaId: number): Promise<BusinessApprovalStatus> {
    await this.delay(50)
    const business = this.businesses.find(b => b.id === businessId && b.palika_id === palikaId)
    if (!business) {
      throw new Error('Business not found')
    }
    return {
      id: business.id,
      verificationStatus: business.verification_status,
      verifiedBy: business.verified_by,
      verifiedAt: business.verified_at,
      rejectionReason: business.rejection_reason,
      businessName: business.name,
      category: business.category,
    }
  }

  async getAdminName(adminId: string): Promise<string> {
    await this.delay(50)
    return 'Admin User'
  }

  async logApprovalAction(params: {
    businessId: string
    palikaId: number
    adminId: string
    action: 'verified' | 'rejected'
    reason?: string
  }): Promise<void> {
    await this.delay(50)
    // Mock logging - no-op
  }

  async getPendingBusinesses(palikaId: number, limit: number = 50, offset: number = 0): Promise<{
    businesses: any[]
    total: number
    limit: number
    offset: number
  }> {
    await this.delay(100)
    const pending = this.businesses.filter(b => b.palika_id === palikaId && b.verification_status === 'pending')
    const paginated = pending.slice(offset, offset + limit)
    return {
      businesses: paginated,
      total: pending.length,
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
    await this.delay(100)
    let filtered = this.businesses.filter(b => b.palika_id === palikaId)

    if (filters?.status) {
      filtered = filtered.filter(b => b.verification_status === filters.status)
    }
    if (filters?.category) {
      filtered = filtered.filter(b => b.category === filters.category)
    }
    if (filters?.search) {
      filtered = filtered.filter(b => b.name.toLowerCase().includes(filters.search!.toLowerCase()))
    }

    const paginated = filtered.slice(offset, offset + limit)
    return {
      businesses: paginated,
      total: filtered.length,
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
    await this.delay(100)
    const stats = this.businesses.filter(b => b.palika_id === palikaId)
    return {
      total: stats.length,
      pending: stats.filter(s => s.verification_status === 'pending').length,
      verified: stats.filter(s => s.verification_status === 'verified').length,
      rejected: stats.filter(s => s.verification_status === 'rejected').length,
      suspended: stats.filter(s => s.verification_status === 'suspended').length,
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
