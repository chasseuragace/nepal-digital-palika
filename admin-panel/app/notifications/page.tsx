'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Bell, Plus, Send, Users, Globe, Filter, RefreshCw, AlertCircle,
  BarChart3, TrendingUp, Clock, Target, Eye, Search, Calendar,
  ChevronLeft, ChevronRight, Info, Zap, Settings
} from 'lucide-react'
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

      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
            }}>
              <Bell size={24} />
            </div>
            Notification Management
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} />
            Send and manage notifications to your palika users
          </p>
        </div>
        <Link 
          href="/notifications/compose" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 24px',
            borderRadius: '12px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 600,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1d4ed8'
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
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
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}>
              <Filter size={18} color="#3b82f6" />
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#374151',
              }}>
                Filters
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ''); setPage(1) }}
                onFocus={() => setFocusedFilter('type')}
                onBlur={() => setFocusedFilter(null)}
                style={{
                  ...selectStyle,
                  borderColor: focusedFilter === 'type' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedFilter === 'type' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
              >
                <option value="">All Types</option>
                <option value="general">General (Broadcast)</option>
                <option value="personal">Personal</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }}
                onFocus={() => setFocusedFilter('category')}
                onBlur={() => setFocusedFilter(null)}
                style={{
                  ...selectStyle,
                  borderColor: focusedFilter === 'category' ? '#3b82f6' : '#e2e8f0',
                  boxShadow: focusedFilter === 'category' ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease',
                }}
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
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    border: '1px solid #ef4444',
                    backgroundColor: '#fff',
                    color: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fef2f2'
                    e.currentTarget.style.borderColor = '#dc2626'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.borderColor = '#ef4444'
                  }}
                >
                  <RefreshCw size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '12px 16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd',
          }}>
            <Info size={16} style={{ color: '#0284c7' }} />
            <span style={{ 
              color: '#0c4a6e', 
              fontSize: '13px',
              fontWeight: 500,
            }}>
              {total} notification{total !== 1 ? 's' : ''} found
              {(typeFilter || categoryFilter) && ' • Filters applied'}
            </span>
          </div>
        </div>

        {/* Notification list */}
        <div style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        }}>
          {error && (
            <div style={{
              padding: '18px 20px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.1)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#dc2626',
                color: '#fff',
                flexShrink: 0,
              }}>
                <AlertCircle size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#991b1b', fontSize: '15px', fontWeight: 600, marginBottom: '2px' }}>
                  Error Loading Notifications
                </div>
                <div style={{ color: '#b91c1c', fontSize: '14px' }}>
                  {error}
                </div>
              </div>
              <button
                onClick={handleRetry}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #dc2626',
                  backgroundColor: '#fff',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fef2f2'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 10px rgba(220, 38, 38, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(220, 38, 38, 0.1)'
                }}
              >
                <RefreshCw size={16} />
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
                borderRadius: '8px',
                overflow: 'hidden',
              }}>
                <thead style={{
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderBottom: '2px solid #cbd5e1',
                }}>
                  <tr>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>Title</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>Type</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>Category</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>Recipients</th>
                    <th style={{
                      padding: '16px 20px',
                      textAlign: 'left',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((n, idx) => (
                    <tr 
                      key={`${n.sample_notification_id}-${idx}`}
                      style={{
                        transition: 'all 0.2s ease',
                        borderBottom: '1px solid #f1f5f9',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc'
                        e.currentTarget.style.transform = 'scale(1.01)'
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <td style={{
                        padding: '16px 20px',
                        fontSize: '14px',
                        color: '#0f172a',
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: '15px' }}>{n.title}</div>
                        <div style={{ color: '#64748b', fontSize: '13px', lineHeight: '1.4' }}>
                          {n.body.length > 80 ? n.body.substring(0, 80) + '...' : n.body}
                        </div>
                      </td>
                      <td style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '14px',
                        color: '#0f172a',
                      }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          backgroundColor: n.notification_type === 'general' ? '#d1fae5' : '#ede9fe',
                          color: n.notification_type === 'general' ? '#065f46' : '#5b21b6',
                          border: `1px solid ${n.notification_type === 'general' ? '#a7f3d0' : '#ddd6fe'}`,
                        }}>
                          {n.notification_type === 'general' ? <Globe size={12} /> : <Users size={12} />}
                          {n.notification_type === 'general' ? 'Broadcast' : 'Personal'}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '14px',
                        color: '#0f172a',
                      }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: getCategoryColor(n.category).bg,
                          color: getCategoryColor(n.category).text,
                          border: `1px solid ${(getCategoryColor(n.category) as any).border || getCategoryColor(n.category).bg}`,
                        }}>
                          {NOTIFICATION_CATEGORIES.find(c => c.value === n.category)?.label_en || n.category}
                        </span>
                      </td>
                      <td style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '14px',
                        color: '#0f172a',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '15px' }}>{n.recipient_count}</span>
                          <span style={{ color: '#64748b', fontSize: '12px' }}>user{n.recipient_count !== 1 ? 's' : ''}</span>
                        </div>
                      </td>
                      <td style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '13px',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Clock size={14} style={{ color: '#94a3b8' }} />
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
                  alignItems: 'center',
                  gap: '12px',
                  padding: '24px 0 16px',
                  borderTop: '1px solid #e2e8f0',
                  marginTop: '20px',
                }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      border: page === 1 ? '1px solid #e2e8f0' : '1px solid #3b82f6',
                      backgroundColor: page === 1 ? '#f8fafc' : '#3b82f6',
                      color: page === 1 ? '#94a3b8' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: page === 1 ? 'none' : '0 2px 6px rgba(59, 130, 246, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      if (page !== 1) {
                        e.currentTarget.style.backgroundColor = '#1d4ed8'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== 1) {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.2)'
                      }
                    }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <span style={{ 
                      color: '#374151', 
                      fontSize: '14px',
                      fontWeight: 500,
                    }}>
                      Page
                    </span>
                    <span style={{ 
                      color: '#3b82f6', 
                      fontSize: '16px',
                      fontWeight: 700,
                    }}>
                      {page}
                    </span>
                    <span style={{ 
                      color: '#64748b', 
                      fontSize: '14px',
                      fontWeight: 500,
                    }}>
                      of {totalPages}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      border: page === totalPages ? '1px solid #e2e8f0' : '1px solid #3b82f6',
                      backgroundColor: page === totalPages ? '#f8fafc' : '#3b82f6',
                      color: page === totalPages ? '#94a3b8' : '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease',
                      boxShadow: page === totalPages ? 'none' : '0 2px 6px rgba(59, 130, 246, 0.2)',
                    }}
                    onMouseEnter={(e) => {
                      if (page !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#1d4ed8'
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.3)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (page !== totalPages) {
                        e.currentTarget.style.backgroundColor = '#3b82f6'
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = '0 2px 6px rgba(59, 130, 246, 0.2)'
                      }
                    }}
                  >
                    Next
                    <ChevronRight size={16} />
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
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)'
    }}>
      {/* Gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}80 100%)`,
      }} />
      
      <div style={{
        backgroundColor: `${color}15`,
        color: color,
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 12px ${color}20`,
        transition: 'all 0.3s ease',
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ 
          fontSize: '28px', 
          fontWeight: 700, 
          color: '#0f172a',
          lineHeight: '1',
          marginBottom: '4px',
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '14px', 
          color: '#64748b',
          fontWeight: 500,
          marginBottom: '2px',
        }}>
          {label}
        </div>
        {description && (
          <div style={{ 
            fontSize: '12px', 
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <Info size={10} />
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '14px',
  color: '#374151',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
}

function StatCardSkeleton() {
  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Gradient accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, #e2e8f0 0%, #cbd5e1 100%)',
      }} />
      
      <SkeletonLoader width={48} height={48} borderRadius="12px" />
      <div style={{ flex: 1 }}>
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
