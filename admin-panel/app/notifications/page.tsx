'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, Plus, Send, Users, Globe, Filter } from 'lucide-react'
import { NOTIFICATION_CATEGORIES, getCategoryColor } from '@/lib/notification-use-cases'

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
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [typeFilter, categoryFilter, page])

  const fetchNotifications = async () => {
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
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/notifications?stats=true&palika_id=${PALIKA_ID}`)
      if (response.ok) {
        setStats(await response.json())
      }
    } catch {
      // Stats are non-critical
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Simple top nav — no auth required */}
      <nav style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={20} color="#fff" />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '16px' }}>
            Notification Management
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/dashboard" style={{ color: '#94a3b8', fontSize: '14px', textDecoration: 'none' }}>
            Dashboard
          </Link>
          <Link href="/notifications/compose" style={{
            color: '#fff',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#3b82f6',
            padding: '6px 14px',
            borderRadius: '6px',
          }}>
            <Plus size={14} /> Compose
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <StatCard label="Total Sent" value={stats?.totalSent ?? '—'} icon={<Send size={18} />} color="#3b82f6" />
          <StatCard label="Broadcasts" value={stats?.generalCount ?? '—'} icon={<Globe size={18} />} color="#10b981" />
          <StatCard label="Personal" value={stats?.personalCount ?? '—'} icon={<Users size={18} />} color="#8b5cf6" />
          <StatCard label="Last 7 Days" value={stats?.recentCount ?? '—'} icon={<Bell size={18} />} color="#f59e0b" />
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '20px' }}>
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
        <div className="card">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Bell size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#64748b', fontSize: '15px', margin: '0 0 16px' }}>
                No notifications sent yet.
              </p>
              <Link href="/notifications/compose" style={{
                color: '#3b82f6',
                textDecoration: 'none',
                fontWeight: 500,
              }}>
                Compose your first notification
              </Link>
            </div>
          ) : (
            <>
              <table className="table">
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
                      <td>
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
                      <td>
                        <span style={{ fontWeight: 500 }}>{n.recipient_count}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}> user{n.recipient_count !== 1 ? 's' : ''}</span>
                      </td>
                      <td style={{ color: '#64748b', fontSize: '13px' }}>
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
                    className="btn btn-secondary"
                    style={{ opacity: page === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '6px 12px', color: '#64748b', fontSize: '14px' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-secondary"
                    style={{ opacity: page === totalPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
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
