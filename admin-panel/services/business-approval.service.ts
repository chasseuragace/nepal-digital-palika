import { supabase } from '@/lib/supabase';

export interface BusinessApprovalStatus {
  id: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  businessName: string;
  category: string;
}

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
  /**
   * Verify a business
   * Sets verification_status to 'verified', tracks admin_id and timestamp
   */
  static async verifyBusiness({
    businessId,
    palikaId,
    adminId,
    notes,
  }: VerifyBusinessRequest): Promise<{ success: boolean }> {
    try {
      // Verify business belongs to palika
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('id, palika_id, name, category')
        .eq('id', businessId)
        .eq('palika_id', palikaId)
        .single();

      if (fetchError || !business) {
        throw new Error('Business not found or does not belong to this palika');
      }

      // Update business status
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          verification_status: 'verified',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          rejection_reason: null, // Clear any previous rejection reason
        })
        .eq('id', businessId)
        .eq('palika_id', palikaId);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await this.logApprovalAction({
        businessId,
        palikaId,
        adminId,
        action: 'verified',
        reason: notes,
      });

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
  static async rejectBusiness({
    businessId,
    palikaId,
    adminId,
    reason,
  }: RejectBusinessRequest): Promise<{ success: boolean }> {
    try {
      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      // Verify business belongs to palika
      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('id, palika_id, name, category')
        .eq('id', businessId)
        .eq('palika_id', palikaId)
        .single();

      if (fetchError || !business) {
        throw new Error('Business not found or does not belong to this palika');
      }

      // Update business status
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          verification_status: 'rejected',
          verified_by: adminId,
          verified_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', businessId)
        .eq('palika_id', palikaId);

      if (updateError) {
        throw updateError;
      }

      // Log the action
      await this.logApprovalAction({
        businessId,
        palikaId,
        adminId,
        action: 'rejected',
        reason,
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting business:', error);
      throw error;
    }
  }

  /**
   * Get business approval status
   */
  static async getBusinessApprovalStatus(
    businessId: string,
    palikaId: number
  ): Promise<BusinessApprovalStatus> {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select(
          'id, verification_status, verified_by, verified_at, rejection_reason, name, category'
        )
        .eq('id', businessId)
        .eq('palika_id', palikaId)
        .single();

      if (error || !business) {
        throw new Error('Business not found');
      }

      return {
        id: business.id,
        verificationStatus: business.verification_status,
        verifiedBy: business.verified_by,
        verifiedAt: business.verified_at,
        rejectionReason: business.rejection_reason,
        businessName: business.name,
        category: business.category,
      };
    } catch (error) {
      console.error('Error getting business approval status:', error);
      throw error;
    }
  }

  /**
   * Get admin name from admin_id
   */
  static async getAdminName(adminId: string): Promise<string> {
    try {
      const { data: admin, error } = await supabase
        .from('admin_users')
        .select('email, first_name, last_name')
        .eq('id', adminId)
        .single();

      if (error || !admin) {
        return 'Unknown Admin';
      }

      if (admin.first_name && admin.last_name) {
        return `${admin.first_name} ${admin.last_name}`;
      }

      return admin.email?.split('@')[0] || 'Unknown Admin';
    } catch (error) {
      console.error('Error getting admin name:', error);
      return 'Unknown Admin';
    }
  }

  /**
   * Log approval action for audit trail
   */
  private static async logApprovalAction({
    businessId,
    palikaId,
    adminId,
    action,
    reason,
  }: {
    businessId: string;
    palikaId: number;
    adminId: string;
    action: 'verified' | 'rejected';
    reason?: string;
  }): Promise<void> {
    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'business',
        entity_id: businessId,
        action: `business_${action}`,
        admin_id: adminId,
        palika_id: palikaId,
        details: {
          action,
          reason,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to log approval action:', error);
      // Don't throw - logging failure shouldn't block the approval
    }
  }

  /**
   * Get businesses pending approval for a palika
   */
  static async getPendingBusinesses(palikaId: number, limit = 50, offset = 0) {
    try {
      const { data: businesses, error, count } = await supabase
        .from('businesses')
        .select('id, name, category, verification_status, created_at', {
          count: 'exact',
        })
        .eq('palika_id', palikaId)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        businesses: businesses || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting pending businesses:', error);
      throw error;
    }
  }

  /**
   * Get all businesses for a palika with filtering
   */
  static async getBusinesses(
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
      let query = supabase
        .from('businesses')
        .select(
          'id, name, category, verification_status, verified_at, rejection_reason, created_at',
          { count: 'exact' }
        )
        .eq('palika_id', palikaId);

      if (filters?.status) {
        query = query.eq('verification_status', filters.status);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data: businesses, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw error;
      }

      return {
        businesses: businesses || [],
        total: count || 0,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting businesses:', error);
      throw error;
    }
  }

  /**
   * Get business verification stats for a palika
   */
  static async getBusinessVerificationStats(palikaId: number) {
    try {
      const { data: stats, error } = await supabase
        .from('businesses')
        .select('verification_status')
        .eq('palika_id', palikaId);

      if (error) {
        throw error;
      }

      const counts = {
        total: stats?.length || 0,
        pending: stats?.filter((s) => s.verification_status === 'pending').length || 0,
        verified: stats?.filter((s) => s.verification_status === 'verified').length || 0,
        rejected: stats?.filter((s) => s.verification_status === 'rejected').length || 0,
        suspended: stats?.filter((s) => s.verification_status === 'suspended').length || 0,
      };

      return counts;
    } catch (error) {
      console.error('Error getting business verification stats:', error);
      throw error;
    }
  }
}
