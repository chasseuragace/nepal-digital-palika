'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Bell, Plus, Send, Users, Globe, Filter, RefreshCw, AlertCircle,
  BarChart3, TrendingUp, Clock, Info
} from 'lucide-react'
import { NOTIFICATION_CATEGORIES, getCategoryColor } from '@/lib/notification-use-cases'
import SkeletonLoader from '@/components/SkeletonLoader'
import Toast, { ToastType } from '@/components/Toast'
import EmptyState from '@/components/EmptyState'
import AdminLayout from '@/components/AdminLayout'
import './notifications.css'

type NotificationType = 'general' | 'personal'

interface SentNotificationSummary {
  title: string
  body: string
  notification_type: NotificationType
  category: string
  image_url?: string
  created_at: string
  recipient_count: number
  target_user_id?: string
  sample_notification_id: string
}

interface NotificationStats {
  totalSent: number
  generalCount: number
  personalCount: number
  categoryBreakdown: Record<string, number>
  recentCount: number
}

// Category colors sourced from lib/notification-use-cases.ts via getCategoryColor()

const PALIKA_ID = 1 // Skeleton default — will come from auth context in production

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<SentNotificationSummary[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const [focusedFilter, setFocusedFilter] = useState<string | null>(null)
  const pageSize = 20

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [typeFilter, categoryFilter, page])

  const fetchNotifications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        palika_id: String(PALIKA_ID),
        page: String(page),
        pageSize: String(pageSize),
      })
      if (typeFilter) params.set('type', typeFilter)
      if (categoryFilter) params.set('category', categoryFilter)

      const response = await fetch(`/api/notifications?${params}`)
      if (response.ok) {
        const result = await response.json()
        setNotifications(result.data || [])
        setTotal(result.total || 0)
        setError(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load notifications')
        setToast({ type: 'error', message: 'Failed to load notifications' })
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      setError('Network error. Please check your connection.')
      setToast({ type: 'error', message: 'Network error. Please check your connection.' })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    setIsStatsLoading(true)
    try {
      const response = await fetch(`/api/notifications?stats=true&palika_id=${PALIKA_ID}`)
      if (response.ok) {
        setStats(await response.json())
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setIsStatsLoading(false)
    }
  }

  const handleRetry = () => {
    fetchNotifications()
    fetchStats()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <AdminLayout>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Page Header */}
      <div className="notifications-page-header">
        <div className="header-content">
          <div className="header-icon-box">
            <Bell size={32} />
          </div>
          <div>
            <h1 className="page-title">Notification Management</h1>
            <p className="page-subtitle">Send and manage notifications to your palika users</p>
          </div>
        </div>
        <Link href="/notifications/compose" className="btn btn-primary header-add-btn">
          <Plus size={18} />
          Compose Notification
        </Link>
      </div>

      <div className="notifications-content">
        {/* Stats cards */}
        <div className="stats-grid">
          {isStatsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard 
                label="Total Sent" 
                value={stats?.totalSent ?? 0} 
                icon={<Send size={20} />} 
                color="#3b82f6" 
                description="All time notifications"
              />
              <StatCard 
                label="Broadcasts" 
                value={stats?.generalCount ?? 0} 
                icon={<Globe size={20} />} 
                color="#10b981" 
                description="To all users"
              />
              <StatCard 
                label="Personal" 
                value={stats?.personalCount ?? 0} 
                icon={<Users size={20} />} 
                color="#8b5cf6" 
                description="Targeted messages"
              />
              <StatCard 
                label="Last 7 Days" 
                value={stats?.recentCount ?? 0} 
                icon={<TrendingUp size={20} />} 
                color="#f59e0b" 
                description="Recent activity"
              />
            </>
          )}
        </div>

        {/* Filters */}
        <div className="filters-card">
          <div className="filters-header">
            <div className="filters-title">
              <Filter size={18} />
              <span>Filters</span>
            </div>
            
            <div className="filter-controls">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ''); setPage(1) }}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="general">General (Broadcast)</option>
                <option value="personal">Personal</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {NOTIFICATION_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label_en} ({cat.label_ne})
                  </option>
                ))}
              </select>
              
              {(typeFilter || categoryFilter) && (
                <button
                  onClick={() => {
                    setTypeFilter('')
                    setCategoryFilter('')
                    setPage(1)
                  }}
                  className="btn-clear-filters"
                >
                  <RefreshCw size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          <div className="results-info">
            <Info size={16} />
            <span>
              {total} notification{total !== 1 ? 's' : ''} found
              {(typeFilter || categoryFilter) && ' • Filters applied'}
            </span>
          </div>
        </div>

        {/* Notification list */}
        <div className="notifications-table-card">
          {error && (
            <div className="error-banner">
              <div className="error-icon">
                <AlertCircle size={20} />
              </div>
              <div className="error-content">
                <div className="error-title">Error Loading Notifications</div>
                <div className="error-message">{error}</div>
              </div>
              <button onClick={handleRetry} className="btn-retry">
                <RefreshCw size={16} />
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="loading-container">
              <TableSkeleton rows={5} />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<Bell size={48} color="#cbd5e1" />}
              title="No notifications sent yet"
              description="Start engaging with your community by composing your first notification."
              action={{
                label: 'Compose Notification',
                onClick: () => window.location.href = '/notifications/compose',
              }}
            />
          ) : (
            <>
              <div className="table-container">
                <table className="notifications-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Recipients</th>
                      <th>Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((n, idx) => (
                      <tr key={`${n.sample_notification_id}-${idx}`}>
                        <td>
                          <div className="notification-title-cell">
                            <div className="notification-title">{n.title}</div>
                            <div className="notification-body">
                              {n.body.length > 80 ? n.body.substring(0, 80) + '...' : n.body}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`type-badge type-${n.notification_type}`}>
                            {n.notification_type === 'general' ? <Globe size={12} /> : <Users size={12} />}
                            {n.notification_type === 'general' ? 'Broadcast' : 'Personal'}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="category-badge"
                            style={{
                              backgroundColor: getCategoryColor(n.category).bg,
                              color: getCategoryColor(n.category).text,
                              border: `1px solid ${(getCategoryColor(n.category) as any).border || getCategoryColor(n.category).bg}`,
                            }}
                          >
                            {NOTIFICATION_CATEGORIES.find(c => c.value === n.category)?.label_en || n.category}
                          </span>
                        </td>
                        <td>
                          <div className="recipients-cell">
                            <span className="recipients-count">{n.recipient_count}</span>
                            <span className="recipients-label">user{n.recipient_count !== 1 ? 's' : ''}</span>
                          </div>
                        </td>
                        <td>
                          <div className="sent-cell">
                            <Clock size={14} />
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={`pagination-btn ${page === 1 ? 'disabled' : ''}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Previous
                  </button>
                  
                  <div className="pagination-info">
                    <span className="pagination-label">Page</span>
                    <span className="pagination-current">{page}</span>
                    <span className="pagination-label">of {totalPages}</span>
                  </div>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={`pagination-btn ${page === totalPages ? 'disabled' : ''}`}
                  >
                    Next
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

// ─── Sub-components ───

function StatCard({ label, value, icon, color, description }: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  description?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {description && (
          <div className="stat-description">
            <Info size={10} />
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <SkeletonLoader width={48} height={48} borderRadius="12px" />
      <div className="stat-content">
        <SkeletonLoader width="60%" height={28} style={{ marginBottom: '6px' }} />
        <SkeletonLoader width="40%" height={16} />
        <SkeletonLoader width="70%" height={12} style={{ marginTop: '4px' }} />
      </div>
    </div>
  )
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <SkeletonLoader width="40%" height={20} />
          <SkeletonLoader width="15%" height={20} />
          <SkeletonLoader width="15%" height={20} />
          <SkeletonLoader width="10%" height={20} />
          <SkeletonLoader width="20%" height={20} />
        </div>
      ))}
    </div>
  )
}
