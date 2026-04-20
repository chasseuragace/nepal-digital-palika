'use client';

import React, { useState, useEffect } from 'react';
import { Package, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { ProductTable } from '@/components/ProductTable';
import { ProductFiltersComponent } from '@/components/ProductFilters';
import { Pagination } from '@/components/Pagination';
import { useVerificationAccess } from '@/lib/hooks/useVerificationAccess';
import { ProductFilters, ProductListItem, ProductListResponse } from '@/services/marketplace-products.service';
import { adminSessionStore } from '@/lib/storage/session-storage.service';
import '../marketplace.css';

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 25,
    sort: 'newest'
  });
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });

  // Get palika_id and admin_id from auth context
  const [palikaId, setPalikaId] = useState<number | null>(null);
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const session = adminSessionStore.get();
    if (session) {
      // Defensive: coerce to number in case legacy sessions stored it as string
      const palika = session.palika_id != null ? Number(session.palika_id) : null;
      setPalikaId(Number.isNaN(palika) ? null : palika);
      setAdminId(session.id);
    }
  }, []);

  const verificationAccess = useVerificationAccess(palikaId || 0);

  useEffect(() => {
    if (!palikaId) return;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append('palika_id', palikaId.toString());
        if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus);
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());

        const response = await fetch(`/api/products?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: ProductListResponse = await response.json();
        setProducts(data.data);
        setMeta(data.meta);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters, palikaId]);

  const handleVerify = async (productId: string) => {
    if (!verificationAccess.canVerify) {
      alert(verificationAccess.errorMessage || 'Verification not available for your tier');
      return;
    }

    if (!palikaId || !adminId) {
      alert('Admin session not found');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/verify?palika_id=${palikaId}&admin_id=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify product');
      }

      // Refresh products
      setFilters({ ...filters });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleReject = async (productId: string) => {
    if (!verificationAccess.canVerify) {
      alert(verificationAccess.errorMessage || 'Rejection not available for your tier');
      return;
    }

    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    if (!palikaId || !adminId) {
      alert('Admin session not found');
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}/reject?palika_id=${palikaId}&admin_id=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject product');
      }

      // Refresh products
      setFilters({ ...filters });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleViewDetails = (productId: string) => {
    // TODO: Navigate to product details page
    console.log('View details for product:', productId);
  };

  const stats = {
    total: meta.total,
    pending: products.filter((p) => p.verificationStatus === 'pending').length,
    verified: products.filter((p) => p.verificationStatus === 'verified').length,
    rejected: products.filter((p) => p.verificationStatus === 'rejected').length,
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading products...</p>
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
              <Package size={32} />
            </div>
            <div>
              <h1 className="page-title">Product Management</h1>
              <p className="page-subtitle">Manage and verify marketplace products</p>
            </div>
          </div>
        </div>

        {/* Tier Info */}
        {palikaId && (
          <div className="card tier-info-card">
            <div className="tier-info-content">
              <div>
                <p className="tier-label">Palika ID</p>
                <p className="tier-value">{palikaId}</p>
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
              <Package size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Products</div>
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

        {/* Error State */}
        {error && (
          <div className="card card-error">
            <div className="alert alert-error">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card">
          <ProductFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Product List */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Package size={20} />
              Products ({meta.total} total)
            </h2>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="loading-container">
                <div className="spinner-large"></div>
                <p>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Package size={64} />
                </div>
                <h3 className="empty-state-title">No products found</h3>
                <p className="empty-state-description">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <>
                <ProductTable
                  products={products}
                  onViewDetails={handleViewDetails}
                  onVerify={handleVerify}
                  onReject={handleReject}
                  canVerify={verificationAccess.canVerify}
                  verificationErrorMessage={verificationAccess.errorMessage}
                />
                <div className="pagination-container">
                  <p className="pagination-info">
                    Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                    {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
                  </p>
                  {meta.totalPages > 1 && (
                    <Pagination
                      page={meta.page}
                      totalPages={meta.totalPages}
                      onPageChange={page => setFilters({ ...filters, page })}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
