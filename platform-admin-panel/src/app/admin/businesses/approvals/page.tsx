'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './approvals.module.css'

interface Business {
  id: string
  business_name: string
  category?: string
  status: string
  verification_status: string
  created_at: string
  contact_phone: string
  contact_email?: string
  owner_info?: Record<string, any>
}

interface ApprovalsData {
  data: Business[]
  total: number
  page: number
  pages: number
}

export default function ApprovalsPage() {
  const router = useRouter()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('pending_review')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [featureEnabled, setFeatureEnabled] = useState(true)

  // Load approvals
  useEffect(() => {
    const loadApprovals = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build query params
        const params = new URLSearchParams()
        params.append('page', currentPage.toString())
        params.append('limit', '25')

        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        if (searchQuery) {
          params.append('search', searchQuery)
        }
        if (categoryFilter) {
          params.append('category', categoryFilter)
        }

        const response = await fetch(`/api/businesses/approvals?${params.toString()}`)
        const data: ApprovalsData = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load approvals')
        }

        setBusinesses(data.data || [])
        setTotal(data.total || 0)
        setTotalPages(data.pages || 1)
      } catch (err) {
        console.error('Error loading approvals:', err)
        setError(err instanceof Error ? err.message : 'Failed to load approvals')
      } finally {
        setLoading(false)
      }
    }

    loadApprovals()
  }, [currentPage, statusFilter, searchQuery, categoryFilter])

  const stats = {
    pending: 0,
    approved: 0,
    rejected: 0,
  }

  const handleApprove = (businessId: string) => {
    router.push(`/admin/businesses/approvals/${businessId}?action=approve`)
  }

  const handleReject = (businessId: string) => {
    router.push(`/admin/businesses/approvals/${businessId}?action=reject`)
  }

  const handleReview = (businessId: string) => {
    router.push(`/admin/businesses/approvals/${businessId}`)
  }

  if (!featureEnabled) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1>Business Verification</h1>
          <div className={styles.featureDisabledBox}>
            <h3>Feature Not Enabled</h3>
            <p>
              Business verification workflow is not enabled for your Palika tier.
            </p>
            <p>
              Please contact your administrator to upgrade your tier and access this feature.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Business Verification Dashboard</h1>
        <p>Review and approve pending business registrations</p>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{total}</div>
          <div className={styles.statLabel}>Total Pending</div>
        </div>
        <div className={styles.statCard + ' ' + styles.approved}>
          <div className={styles.statNumber}>{stats.approved}</div>
          <div className={styles.statLabel}>Approved</div>
        </div>
        <div className={styles.statCard + ' ' + styles.rejected}>
          <div className={styles.statNumber}>{stats.rejected}</div>
          <div className={styles.statLabel}>Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search by business name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterRow}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.select}
          >
            <option value="pending_review">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            className={styles.select}
          >
            <option value="">All Categories</option>
            <option value="hotel">Hotel</option>
            <option value="restaurant">Restaurant</option>
            <option value="tour">Tour Operator</option>
            <option value="guide">Guide Service</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Businesses Table */}
      {loading ? (
        <div className={styles.loadingBox}>Loading approvals...</div>
      ) : error ? (
        <div className={styles.errorBox}>{error}</div>
      ) : businesses.length === 0 ? (
        <div className={styles.emptyBox}>
          <p>No pending approvals</p>
          <p>Check back later for new business registrations</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Category</th>
                  <th>Submitted</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <td>
                      <strong>{business.business_name}</strong>
                    </td>
                    <td>{business.category || '-'}</td>
                    <td>{new Date(business.created_at).toLocaleDateString()}</td>
                    <td>
                      <a href={`tel:${business.contact_phone}`}>{business.contact_phone}</a>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[business.status.replace(/_/g, '-')]}`}>
                        {business.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          onClick={() => handleReview(business.id)}
                          className={styles.reviewButton}
                          title="View details"
                        >
                          Review
                        </button>
                        <button
                          onClick={() => handleApprove(business.id)}
                          className={styles.approveButton}
                          title="Approve business"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => handleReject(business.id)}
                          className={styles.rejectButton}
                          title="Reject business"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={styles.paginationButton}
              >
                ← Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={styles.paginationButton}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Settings Link */}
      <div className={styles.footer}>
        <Link href="/admin/businesses/approvals/settings" className={styles.settingsLink}>
          ⚙️ Approval Settings
        </Link>
      </div>
    </div>
  )
}
