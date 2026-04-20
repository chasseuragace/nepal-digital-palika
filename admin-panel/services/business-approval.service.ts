import { IBusinessApprovalDatasource, BusinessApprovalStatus } from '@/lib/business-approval-datasource'
import { getBusinessApprovalDatasource } from '@/lib/business-approval-config'

export interface VerifyBusinessRequest {
  businessId: string;
  palikaId: number;
  adminId: string;
  notes?: string;
}

export interface RejectBusinessRequest {
  businessId: string;
  palikaId: number;
  adminId: string;
  reason: string;
}

/**
 * Business Approval Service
 * Handles verification and rejection of businesses with tracking
 */
export class BusinessApprovalService {
  private datasource: IBusinessApprovalDatasource

  constructor(datasource?: IBusinessApprovalDatasource) {
    this.datasource = datasource || getBusinessApprovalDatasource()
  }
  /**
   * Verify a business
   * Sets verification_status to 'verified', tracks admin_id and timestamp
   */
  async verifyBusiness({
    businessId,
    palikaId,
    adminId,
    notes,
  }: VerifyBusinessRequest): Promise<{ success: boolean }> {
    try {
      await this.datasource.verifyBusiness(businessId, palikaId, adminId, notes)
      return { success: true };
    } catch (error) {
      console.error('Error verifying business:', error);
      throw error;
    }
  }

  /**
   * Reject a business
   * Sets verification_status to 'rejected', tracks admin_id, timestamp, and reason
   */
  async rejectBusiness({
    businessId,
    palikaId,
    adminId,
    reason,
  }: RejectBusinessRequest): Promise<{ success: boolean }> {
    try {
      await this.datasource.rejectBusiness(businessId, palikaId, adminId, reason)
      return { success: true };
    } catch (error) {
      console.error('Error rejecting business:', error);
      throw error;
    }
  }

  /**
   * Get business approval status
   */
  async getBusinessApprovalStatus(
    businessId: string,
    palikaId: number
  ): Promise<BusinessApprovalStatus> {
    try {
      return await this.datasource.getBusinessApprovalStatus(businessId, palikaId)
    } catch (error) {
      console.error('Error getting business approval status:', error);
      throw error;
    }
  }

  /**
   * Get admin name from admin_id
   */
  async getAdminName(adminId: string): Promise<string> {
    try {
      return await this.datasource.getAdminName(adminId)
    } catch (error) {
      console.error('Error getting admin name:', error);
      return 'Unknown Admin';
    }
  }

  // Private helper method removed - logic moved to datasource

  /**
   * Get businesses pending approval for a palika
   */
  async getPendingBusinesses(palikaId: number, limit = 50, offset = 0) {
    try {
      return await this.datasource.getPendingBusinesses(palikaId, limit, offset)
    } catch (error) {
      console.error('Error getting pending businesses:', error);
      throw error;
    }
  }

  /**
   * Get all businesses for a palika with filtering
   */
  async getBusinesses(
    palikaId: number,
    filters?: {
      status?: 'pending' | 'verified' | 'rejected' | 'suspended';
      category?: string;
      search?: string;
    },
    limit = 50,
    offset = 0
  ) {
    try {
      return await this.datasource.getBusinesses(palikaId, filters, limit, offset)
    } catch (error) {
      console.error('Error getting businesses:', error);
      throw error;
    }
  }

  /**
   * Get business verification stats for a palika
   */
  async getBusinessVerificationStats(palikaId: number) {
    try {
      return await this.datasource.getBusinessVerificationStats(palikaId)
    } catch (error) {
      console.error('Error getting business verification stats:', error);
      throw error;
    }
  }
}
