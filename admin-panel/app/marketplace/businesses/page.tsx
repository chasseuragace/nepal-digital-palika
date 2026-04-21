'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertCircle, Building2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { BusinessTable } from '@/components/BusinessTable';
import { BusinessFilters } from '@/components/BusinessFilters';
import { useVerificationAccess } from '@/lib/hooks/useVerificationAccess';
import { toast } from 'sonner';
import { adminSessionStore } from '@/lib/storage/session-storage.service';

// Client-side pages can't import the server-side BusinessApprovalService
// (it constructs a Supabase service-role client). Hit the HTTP API routes
// directly — same path the cookie-signed session travels.
async function fetchBusinesses(
  palikaId: number,
  filters: { status?: string; category?: string; search?: string },
  limit: number,
  offset: number
): Promise<{ businesses: Business[]; total: number }> {
  const p = new URLSearchParams({
    palika_id: String(palikaId),
    limit: String(limit),
    offset: String(offset),
  });
  if (filters.status) p.append('status', filters.status);
  if (filters.category) p.append('category', filters.category);
  if (filters.search) p.append('search', filters.search);
  const r = await fetch(`/api/businesses?${p.toString()}`);
  if (!r.ok) throw new Error(`GET /api/businesses ${r.status}`);
  return r.json();
}

async function verifyBusiness(
  businessId: string,
  palikaId: number,
  adminId: string,
  notes?: string
): Promise<void> {
  const r = await fetch(
    `/api/businesses/${businessId}/verify?palika_id=${palikaId}&admin_id=${adminId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    }
  );
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`verify failed ${r.status}: ${body}`);
  }
}

async function rejectBusiness(
  businessId: string,
  palikaId: number,
  adminId: string,
  reason: string
): Promise<void> {
  const r = await fetch(
    `/api/businesses/${businessId}/reject?palika_id=${palikaId}&admin_id=${adminId}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }
  );
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`reject failed ${r.status}: ${body}`);
  }
}
import '../marketplace.css';

// Shape matches what /api/businesses returns (columns as persisted in the
// `businesses` table). The BusinessTable component reads the snake_case
// fields directly.
interface Business {
  id: string;
  business_name: string;
  sub_category: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  verified_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export default function BusinessesPage() {
  const adminSession = adminSessionStore.get();
  const palikaId = adminSession?.palika_id ? Number(adminSession.palika_id) : null;
  const adminId = adminSession?.id ?? null;
  const verificationAccess = useVerificationAccess(palikaId || undefined);

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
    if (!palikaId) return;
    loadBusinesses();
  }, [palikaId, filters, pagination.offset]);

  const loadBusinesses = async () => {
    if (!palikaId) return;

    try {
      setLoading(true);
      const result = await fetchBusinesses(
        palikaId,
        {
          status: filters.status,
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
    if (!palikaId || !adminId) {
      toast.error('Missing admin session');
      return;
    }
    try {
      await verifyBusiness(businessId, palikaId, adminId);
      toast.success('Business verified');
      await loadBusinesses();
    } catch (error) {
      console.error('Error verifying business:', error);
      toast.error('Failed to verify business');
      throw error;
    }
  };

  const handleReject = async (businessId: string, reason: string) => {
    if (!palikaId || !adminId) {
      toast.error('Missing admin session');
      return;
    }
    try {
      await rejectBusiness(businessId, palikaId, adminId, reason);
      toast.success('Business rejected');
      await loadBusinesses();
    } catch (error) {
      console.error('Error rejecting business:', error);
      toast.error('Failed to reject business');
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

  if (verificationAccess.loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading tier information...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="marketplace-container">
        <div className="marketplace-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <Building2 size={32} />
            </div>
            <div>
              <h1 className="page-title">Business Management</h1>
              <p className="page-subtitle">Manage and verify marketplace businesses</p>
            </div>
          </div>
        </div>

        {/* Tier Info */}
        {verificationAccess.tierName && (
          <div className="card tier-info-card">
            <div className="tier-info-content">
              <div>
                <p className="tier-label">Tier</p>
                <p className="tier-value">{verificationAccess.tierName}</p>
              </div>
              <div>
                <p className="tier-label">Approval Workflow</p>
                <span className={`badge ${verificationAccess.canVerify ? 'badge-success' : 'badge-warning'}`}>
                  {verificationAccess.canVerify ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            {!verificationAccess.canVerify && verificationAccess.errorMessage && (
              <div className="alert alert-warning">
                <AlertCircle size={20} />
                <p>{verificationAccess.errorMessage}</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <Building2 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Businesses</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <AlertCircle size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon verified">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.verified}</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rejected">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card">
          <BusinessFilters
            onStatusChange={(status) => handleFilterChange({ status })}
            onSearchChange={(search) => handleFilterChange({ search })}
            onReset={handleReset}
          />
        </div>

        {/* Business List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Package size={20} />
              Businesses ({pagination.total} total)
            </h2>
          </div>
          <div className="card-body">
            <BusinessTable
              businesses={businesses}
              loading={loading}
              onVerify={verificationAccess.canVerify ? handleVerify : undefined}
              onReject={verificationAccess.canVerify ? handleReject : undefined}
              canVerify={verificationAccess.canVerify}
              verificationErrorMessage={verificationAccess.errorMessage}
            />

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="pagination-container">
                <p className="pagination-info">
                  Showing {pagination.offset + 1} to{' '}
                  {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
                  {pagination.total}
                </p>
                <div className="pagination-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: Math.max(0, prev.offset - prev.limit),
                      }))
                    }
                    disabled={pagination.offset === 0}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        offset: prev.offset + prev.limit,
                      }))
                    }
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
