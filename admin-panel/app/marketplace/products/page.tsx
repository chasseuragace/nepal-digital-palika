'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { ProductFilters, ProductListItem, ProductListResponse } from '@/services/marketplace-products.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import { useVerificationAccess } from '@/lib/hooks/useVerificationAccess'
import './products.css'

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [palikaId, setPalikaId] = useState<number | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    const session = adminSessionStore.get()
    if (session) {
      const palika = session.palika_id != null ? Number(session.palika_id) : null
      setPalikaId(Number.isNaN(palika) ? null : palika)
      setAdminId(session.id)
    }
  }, [])

  const verificationAccess = useVerificationAccess(palikaId || 0)

  useEffect(() => {
    if (!palikaId) return
    fetchProducts()
  }, [palikaId])

  const fetchProducts = async () => {
    if (!palikaId) return
    
    try {
      const params = new URLSearchParams()
      params.append('palika_id', palikaId.toString())
      params.append('page', '1')
      params.append('limit', '100')

      const response = await fetch(`/api/products?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch products')

      const data: ProductListResponse = await response.json()
      setProducts(data.data)
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (productId: string) => {
    if (!verificationAccess.canVerify || !palikaId || !adminId) {
      alert(verificationAccess.errorMessage || 'Verification not available')
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}/verify?palika_id=${palikaId}&admin_id=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to verify product')
      }

      fetchProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleReject = async (productId: string) => {
    if (!verificationAccess.canVerify || !palikaId || !adminId) {
      alert(verificationAccess.errorMessage || 'Rejection not available')
      return
    }

    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    try {
      const response = await fetch(`/api/products/${productId}/reject?palika_id=${palikaId}&admin_id=${adminId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject product')
      }

      fetchProducts()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.title?.toLowerCase().includes(filter.toLowerCase()) ||
      product.businessName?.toLowerCase().includes(filter.toLowerCase())

    const matchesStatus = statusFilter === 'all' || product.verificationStatus === statusFilter
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  const stats = {
    total: products.length,
    verified: products.filter(p => p.verificationStatus === 'verified').length,
    pending: products.filter(p => p.verificationStatus === 'pending').length,
    rejected: products.filter(p => p.verificationStatus === 'rejected').length
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading products...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="products-container">
        <div className="products-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Product Management</h1>
              <p className="page-subtitle">Manage and verify marketplace products</p>
            </div>
          </div>
          <Link href="/marketplace/products/new" className="btn btn-primary header-add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Product
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Products</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon verified">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.verified}</div>
              <div className="stat-label">Verified</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon rejected">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        <div className="products-content-card">
          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search by product or business name..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                <option value="food">Food</option>
                <option value="crafts">Crafts</option>
                <option value="clothing">Clothing</option>
                <option value="electronics">Electronics</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-info">
            Showing <strong>{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Business</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="product-name-cell">
                        <div className="product-name">{product.title}</div>
                      </div>
                    </td>
                    <td>{product.businessName || 'N/A'}</td>
                    <td>
                      <span className="category-badge">
                        {product.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td>NPR {product.price?.toLocaleString() || '0'}</td>
                    <td>
                      <span className={`status-badge status-${product.verificationStatus}`}>
                        {product.verificationStatus}
                      </span>
                    </td>
                    <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <Link href={`/marketplace/products/${product.id}`} className="btn-icon" title="View">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Link>
                        {verificationAccess.canVerify && product.verificationStatus === 'pending' && (
                          <>
                            <button onClick={() => handleVerify(product.id)} className="btn-icon btn-verify" title="Verify">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                            <button onClick={() => handleReject(product.id)} className="btn-icon btn-reject" title="Reject">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <h3 className="empty-state-title">
                {filter || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No products match your filters'
                  : 'No products yet'}
              </h3>
              <p className="empty-state-description">
                {filter || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first product'}
              </p>
              {!filter && statusFilter === 'all' && categoryFilter === 'all' && (
                <Link href="/marketplace/products/new" className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add First Product
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
