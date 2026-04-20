/**
 * Abstract Business Approval Datasource
 * Defines contract for business approval operations
 * Allows switching between real (Supabase) and fake (mock) implementations
 */

export interface BusinessApprovalStatus {
  id: string
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended'
  verifiedBy?: string
  verifiedAt?: string
  rejectionReason?: string
  businessName: string
  category: string
}

export interface IBusinessApprovalDatasource {
  // Verify a business
  verifyBusiness(businessId: string, palikaId: number, adminId: string, notes?: string): Promise<void>

  // Reject a business
  rejectBusiness(businessId: string, palikaId: number, adminId: string, reason: string): Promise<void>

  // Get business approval status
  getBusinessApprovalStatus(businessId: string, palikaId: number): Promise<BusinessApprovalStatus>

  // Get admin name from admin_id
  getAdminName(adminId: string): Promise<string>

  // Log approval action for audit trail
  logApprovalAction(params: {
    businessId: string
    palikaId: number
    adminId: string
    action: 'verified' | 'rejected'
    reason?: string
  }): Promise<void>

  // Get businesses pending approval for a palika
  getPendingBusinesses(palikaId: number, limit?: number, offset?: number): Promise<{
    businesses: any[]
    total: number
    limit: number
    offset: number
  }>

  // Get all businesses for a palika with filtering
  getBusinesses(
    palikaId: number,
    filters?: {
      status?: 'pending' | 'verified' | 'rejected' | 'suspended'
      category?: string
      search?: string
    },
    limit?: number,
    offset?: number
  ): Promise<{
    businesses: any[]
    total: number
    limit: number
    offset: number
  }>

  // Get business verification stats for a palika
  getBusinessVerificationStats(palikaId: number): Promise<{
    total: number
    pending: number
    verified: number
    rejected: number
    suspended: number
  }>
}
