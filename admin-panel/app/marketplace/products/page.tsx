'use client'

import { useEffect, useState } from 'react'
import { ProductTable } from '@/components/ProductTable'
import { ProductFiltersComponent } from '@/components/ProductFilters'
import { Pagination } from '@/components/Pagination'
import { useVerificationAccess } from '@/lib/hooks/useVerificationAccess'
import { ProductFilters, ProductListItem, ProductListResponse } from '@/services/marketplace-products.service'

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 25,
    sort: 'newest'
  })
  const [meta, setMeta] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 })

  // Get palika_id and admin_id from auth context
  const [palikaId, setPalikaId] = useState<number | null>(null)
  const [adminId, setAdminId] = useState<string | null>(null)

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession')
    if (adminSession) {
      const admin = JSON.parse(adminSession)
      setPalikaId(admin.palika_id ? parseInt(admin.palika_id, 10) : null)
      setAdminId(admin.id)
    }
  }, [])

  const verificationAccess = useVerificationAccess(palikaId || 0)

  useEffect(() => {
    if (!palikaId) return

    const fetchProducts = async () => {
      try {
        setLoading(true)

        const params = new URLSearchParams()
        params.append('palika_id', palikaId.toString())
        if (filters.verificationStatus) params.append('verificationStatus', filters.verificationStatus)
        if (filters.category) params.append('category', filters.category)
        if (filters.search) params.append('search', filters.search)
        if (filters.sort) params.append('sort', filters.sort)
        if (filters.page) params.append('page', filters.page.toString())
        if (filters.limit) params.append('limit', filters.limit.toString())

        const response = await fetch(`/api/products?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data: ProductListResponse = await response.json()
        setProducts(data.data)
        setMeta(data.meta)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [filters, palikaId])

  const handleVerify = async (productId: string) => {
    if (!verificationAccess.canVerify) {
      alert(verificationAccess.errorMessage || 'Verification not available for your tier')
      return
    }

    if (!palikaId || !adminId) {
      alert('Admin session not found')
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

      // Refresh products
      setFilters({ ...filters })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleReject = async (productId: string) => {
    if (!verificationAccess.canVerify) {
      alert(verificationAccess.errorMessage || 'Rejection not available for your tier')
      return
    }

    const reason = prompt('Enter rejection reason:')
    if (!reason) return

    if (!palikaId || !adminId) {
      alert('Admin session not found')
      return
    }

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

      // Refresh products
      setFilters({ ...filters })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleViewDetails = (productId: string) => {
    // TODO: Navigate to product details page
    console.log('View details for product:', productId)
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace Products</h1>
          {!verificationAccess.loading && !verificationAccess.canVerify && (
            <p className="text-sm text-blue-600 mt-2">
              ℹ️ {verificationAccess.errorMessage}
            </p>
          )}
        </div>

        <ProductFiltersComponent filters={filters} onFiltersChange={setFilters} />

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center text-gray-600">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center text-gray-600">No products found</div>
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
              <div className="p-6 border-t">
                <div className="text-sm text-gray-600 mb-4">
                  Showing {(meta.page - 1) * meta.limit + 1} to{' '}
                  {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} products
                </div>
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
  )
}
