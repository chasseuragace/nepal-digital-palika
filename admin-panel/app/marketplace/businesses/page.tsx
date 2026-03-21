'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { BusinessTable } from '@/components/BusinessTable';
import { BusinessFilters } from '@/components/BusinessFilters';
import { useVerificationAccess } from '@/lib/hooks/useVerificationAccess';
import { BusinessApprovalService } from '@/services/business-approval.service';
import { toast } from 'sonner';

interface Business {
  id: string;
  name: string;
  category: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export default function BusinessesPage() {
  const router = useRouter();
  const { canVerify, verificationErrorMessage, tierInfo, loading: tierLoading } = useVerificationAccess();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
  });

  // Load businesses
  useEffect(() => {
    if (!tierInfo?.palikaId) return;
    loadBusinesses();
  }, [tierInfo?.palikaId, filters, pagination.offset]);

  const loadBusinesses = async () => {
    if (!tierInfo?.palikaId) return;

    try {
      setLoading(true);
      const result = await BusinessApprovalService.getBusinesses(
        tierInfo.palikaId,
        {
          status: filters.status as any,
          category: filters.category,
          search: filters.search,
        },
        pagination.limit,
        pagination.offset
      );

      setBusinesses(result.businesses);
      setPagination((prev) => ({
        ...prev,
        total: result.total,
      }));
    } catch (error) {
      console.error('Error loading businesses:', error);
      toast.error('Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (businessId: string) => {
    if (!tierInfo?.palikaId) return;

    try {
      // TODO: Get admin_id from auth context
      const adminId = 'admin-placeholder'; // Placeholder

      await BusinessApprovalService.verifyBusiness({
        businessId,
        palikaId: tierInfo.palikaId,
        adminId,
      });

      // Reload businesses
      await loadBusinesses();
    } catch (error) {
      console.error('Error verifying business:', error);
      throw error;
    }
  };

  const handleReject = async (businessId: string, reason: string) => {
    if (!tierInfo?.palikaId) return;

    try {
      // TODO: Get admin_id from auth context
      const adminId = 'admin-placeholder'; // Placeholder

      await BusinessApprovalService.rejectBusiness({
        businessId,
        palikaId: tierInfo.palikaId,
        adminId,
        reason,
      });

      // Reload businesses
      await loadBusinesses();
    } catch (error) {
      console.error('Error rejecting business:', error);
      throw error;
    }
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handleReset = () => {
    setFilters({ status: '', category: '', search: '' });
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const stats = {
    total: pagination.total,
    pending: businesses.filter((b) => b.verification_status === 'pending').length,
    verified: businesses.filter((b) => b.verification_status === 'verified').length,
    rejected: businesses.filter((b) => b.verification_status === 'rejected').length,
  };

  if (tierLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-500 flex items-center">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          Loading tier information...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="hover:bg-emerald-50 hover:text-emerald-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Business Management</h1>
              <p className="text-gray-600">Manage and verify marketplace businesses</p>
            </div>
          </div>
        </div>

        {/* Tier Info */}
        {tierInfo && (
          <Card className="mb-6 bg-white/80 backdrop-blur-sm border-green-200/50 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tier</p>
                  <p className="text-lg font-semibold text-gray-800">{tierInfo.tierName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approval Workflow</p>
                  <Badge
                    className={
                      canVerify
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {canVerify ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              {!canVerify && verificationErrorMessage && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-700">{verificationErrorMessage}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm border-green-200/50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-yellow-200/50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-emerald-200/50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Verified</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.verified}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-red-200/50 shadow-lg">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-1">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <BusinessFilters
          onStatusChange={(status) => handleFilterChange({ status })}
          onSearchChange={(search) => handleFilterChange({ search })}
          onReset={handleReset}
        />

        {/* Business List */}
        <Card className="mt-6 bg-white/80 backdrop-blur-sm border-green-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-800">
              <Package className="w-5 h-5 text-emerald-600 mr-2" />
              Businesses ({pagination.total} total)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BusinessTable
              businesses={businesses}
              loading={loading}
              onVerify={canVerify ? handleVerify : undefined}
              onReject={canVerify ? handleReject : undefined}
              canVerify={canVerify}
              verificationErrorMessage={verificationErrorMessage}
            />

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                  {pagination.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit),
                      }))
                    }
                    disabled={pagination.offset === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit,
                      }))
                    }
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
