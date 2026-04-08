'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Plus, Send, Users, Globe, Filter, RefreshCw, AlertCircle } from 'lucide-react'
import { NOTIFICATION_CATEGORIES, getCategoryColor } from '@/lib/notification-use-cases'
import SkeletonLoader from '@/components/SkeletonLoader'
import Toast, { ToastType } from '@/components/Toast'
import EmptyState from '@/components/EmptyState'
import AdminLayout from '@/components/AdminLayout'

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

      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#1e293b' }}>
            Notification Management
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '14px' }}>
            Send and manage notifications to your palika users
          </p>
        </div>
        <Link 
          href="/notifications/compose" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <Plus size={18} />
          Compose Notification
        </Link>
      </div>

      <div style={{ maxWidth: '100%' }}>
        {/* Stats cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {isStatsLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Sent" value={stats?.totalSent ?? 0} icon={<Send size={18} />} color="#3b82f6" />
              <StatCard label="Broadcasts" value={stats?.generalCount ?? 0} icon={<Globe size={18} />} color="#10b981" />
              <StatCard label="Personal" value={stats?.personalCount ?? 0} icon={<Users size={18} />} color="#8b5cf6" />
              <StatCard label="Last 7 Days" value={stats?.recentCount ?? 0} icon={<Bell size={18} />} color="#f59e0b" />
            </>
          )}
        </div>

        {/* Filters */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Filter size={16} color="#64748b" />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ''); setPage(1) }}
              style={selectStyle}
            >
              <option value="">All Types</option>
              <option value="general">General (Broadcast)</option>
              <option value="personal">Personal</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
              style={selectStyle}
            >
              <option value="">All Categories</option>
              {NOTIFICATION_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label_en} ({cat.label_ne})
                </option>
              ))}
            </select>
            <span style={{ color: '#94a3b8', fontSize: '13px', marginLeft: 'auto' }}>
              {total} notification{total !== 1 ? 's' : ''} found
            </span>
          </div>
        </div>

        {/* Notification list */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          padding: '20px',
          border: '1px solid #e2e8f0',
        }}>
          {error && (
            <div style={{
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <AlertCircle size={20} color="#dc2626" />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#991b1b', fontSize: '14px', fontWeight: 500 }}>
                  {error}
                </div>
              </div>
              <button
                onClick={handleRetry}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dc2626',
                  backgroundColor: '#fff',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div style={{ padding: '20px' }}>
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
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}>
                <thead style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '2px solid #e2e8f0',
                }}>
                  <tr>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                    }}>Title</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                    }}>Type</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                    }}>Category</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                    }}>Recipients</th>
                    <th style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      textTransform: 'uppercase',
                      letterSpacing: '0.025em',
                    }}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n, idx) => (
                    <tr 
                      key={`${n.sample_notification_id}-${idx}`}
                      style={{
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        color: '#1e293b',
                      }}>
                        <div style={{ fontWeight: 500 }}>{n.title}</div>
                        <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
                          {n.body.length > 80 ? n.body.substring(0, 80) + '...' : n.body}
                        </div>
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                          backgroundColor: n.notification_type === 'general' ? '#d1fae5' : '#ede9fe',
                          color: n.notification_type === 'general' ? '#065f46' : '#5b21b6',
                        }}>
                          {n.notification_type === 'general' ? 'Broadcast' : 'Personal'}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        color: '#1e293b',
                      }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          backgroundColor: getCategoryColor(n.category).bg,
                          color: getCategoryColor(n.category).text,
                        }}>
                          {NOTIFICATION_CATEGORIES.find(c => c.value === n.category)?.label_en || n.category}
                        </span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        color: '#1e293b',
                      }}>
                        <span style={{ fontWeight: 500 }}>{n.recipient_count}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}> user{n.recipient_count !== 1 ? 's' : ''}</span>
                      </td>
                      <td style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '13px',
                        color: '#64748b',
                      }}>
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '16px 0',
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#fff',
                      color: '#475569',
                      opacity: page === 1 ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '6px 12px', color: '#64748b', fontSize: '14px' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#fff',
                      color: '#475569',
                      opacity: page === totalPages ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Next
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

function StatCard({ label, value, icon, color }: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '16px 20px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <div style={{
        backgroundColor: `${color}15`,
        color: color,
        borderRadius: '8px',
        padding: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{value}</div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{label}</div>
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #e2e8f0',
  fontSize: '13px',
  color: '#475569',
  backgroundColor: '#fff',
  cursor: 'pointer',
}

function StatCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      padding: '16px 20px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <SkeletonLoader width={40} height={40} borderRadius="8px" />
      <div style={{ flex: 1 }}>
        <SkeletonLoader width="60%" height={24} style={{ marginBottom: '6px' }} />
        <SkeletonLoader width="40%" height={14} />
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
