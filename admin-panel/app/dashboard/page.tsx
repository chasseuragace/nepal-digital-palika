'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { StatCard, InfoBox, ActionButton, SectionHeading } from './components'
import { styles } from './styles'
import { adminSessionStore } from '@/lib/storage/session-storage.service'

interface DashboardStats {
  palika_profile?: {
    id: number
    name_en: string
    name_ne: string
    code: string
    type: string
    province: string
    district: string
    office_phone?: string
    office_email?: string
    website?: string
    total_wards?: number
    is_active?: boolean
    subscription_tier?: string
    subscription_tier_display?: string
    subscription_start_date?: string
    subscription_end_date?: string
    cost_per_month?: number
    created_at?: string
    updated_at?: string
  } | null
  heritage_sites: number
  events: number
  blog_posts: number
  pending_approvals: number
  recent_activity: Array<{
    id: string
    type: string
    title: string
    created_at: string
  }>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const admin = adminSessionStore.get()

      const params = new URLSearchParams()
      if (admin?.palika_id) {
        params.append('palika_id', String(admin.palika_id))
      }

      const response = await fetch(`/api/dashboard/stats?${params.toString()}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', fontSize: '18px', color: '#666' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '50px', height: '50px', border: '4px solid #f3f3f3', borderTop: '4px solid #007bff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            Loading dashboard...
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={styles.heading1}>Dashboard</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Welcome back! Here's what's happening with your Palika.</p>
      </div>

      {stats && (
        <>
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <StatCard title="Heritage Sites" value={stats.heritage_sites} href="/heritage-sites" isBlue />
            <StatCard title="Events" value={stats.events} href="/events" isBlue={false} />
            <StatCard title="Blog Posts" value={stats.blog_posts} href="/blog-posts" isBlue />
            <StatCard title="Pending Approvals" value={stats.pending_approvals} href="#" isBlue={false} color={stats.pending_approvals > 0 ? '#ef4444' : '#10b981'} />
          </div>

          {/* Palika Profile */}
          {stats.palika_profile && (
            <div style={styles.card}>
              <SectionHeading
                title="Palika Profile"
                status={stats.palika_profile.is_active ? '● Active' : '● Inactive'}
                statusColor={stats.palika_profile.is_active ? '#d1fae5' : '#fee2e2'}
              />

              {/* Basic Information */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionHeading}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <InfoBox label="NAME (ENGLISH)" value={stats.palika_profile.name_en} />
                  <InfoBox label="NAME (NEPALI)" value={stats.palika_profile.name_ne} variant="blue" />
                  <InfoBox label="CODE" value={stats.palika_profile.code} variant="blue" />
                  <InfoBox label="TYPE" value={stats.palika_profile.type?.replace(/_/g, ' ') || 'N/A'} variant="blue" />
                  <InfoBox label="PROVINCE" value={stats.palika_profile.province} variant="blue" />
                  <InfoBox label="DISTRICT" value={stats.palika_profile.district} variant="blue" />
                  <InfoBox label="TOTAL WARDS" value={stats.palika_profile.total_wards || 'N/A'} variant="blue" />
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionHeading}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={styles.infoBoxYellow}>
                    <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '600', marginBottom: '6px' }}>📞 OFFICE PHONE</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#78350f' }}>{stats.palika_profile.office_phone || 'Not provided'}</div>
                  </div>
                  <div style={styles.infoBoxBlueLight}>
                    <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600', marginBottom: '6px' }}>✉️ OFFICE EMAIL</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e3a8a', wordBreak: 'break-all' }}>{stats.palika_profile.office_email || 'Not provided'}</div>
                  </div>
                  <div style={styles.infoBoxIndigo}>
                    <div style={{ fontSize: '12px', color: '#3730a3', fontWeight: '600', marginBottom: '6px' }}>🌐 WEBSITE</div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#312e81' }}>
                      {stats.palika_profile.website ? (
                        <a href={stats.palika_profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', textDecoration: 'underline' }}>
                          {stats.palika_profile.website}
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div style={{ marginBottom: '28px' }}>
                <h3 style={styles.sectionHeading}>Subscription Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <div style={styles.gradientBlue}>
                    <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '600', marginBottom: '8px' }}>CURRENT TIER</div>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>{stats.palika_profile.subscription_tier_display || stats.palika_profile.subscription_tier || 'Not assigned'}</div>
                  </div>
                  <div style={styles.gradientPink}>
                    <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: '600', marginBottom: '8px' }}>MONTHLY COST</div>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>{stats.palika_profile.cost_per_month ? `NPR ${stats.palika_profile.cost_per_month.toLocaleString()}` : 'N/A'}</div>
                  </div>
                  <InfoBox label="START DATE" value={stats.palika_profile.subscription_start_date ? new Date(stats.palika_profile.subscription_start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} variant="green" />
                  <InfoBox label="END DATE" value={stats.palika_profile.subscription_end_date ? new Date(stats.palika_profile.subscription_end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} variant="red" />
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 style={styles.sectionHeading}>System Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                  <InfoBox label="CREATED" value={stats.palika_profile.created_at ? new Date(stats.palika_profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} variant="gray" />
                  <InfoBox label="LAST UPDATED" value={stats.palika_profile.updated_at ? new Date(stats.palika_profile.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'} variant="gray" />
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity & Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px', marginTop: '30px' }}>
            {/* Recent Activity */}
            <div style={styles.card}>
              <h3 style={styles.heading3}>Recent Activity</h3>
              {stats.recent_activity.length > 0 ? (
                <div>
                  {stats.recent_activity.map((item, index) => (
                    <div key={item.id} style={{ marginBottom: index < stats.recent_activity.length - 1 ? '16px' : '0', paddingBottom: index < stats.recent_activity.length - 1 ? '16px' : '0', borderBottom: index < stats.recent_activity.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        <span style={{ color: '#3b82f6', textTransform: 'uppercase', fontSize: '12px', fontWeight: '700' }}>{item.type}</span>
                        {' • '}
                        {item.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                        {new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9ca3af', fontSize: '14px' }}>No recent activity</div>
              )}
            </div>

            {/* Quick Actions */}
            <div style={styles.card}>
              <h3 style={styles.heading3}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ActionButton href="/heritage-sites/new" label="Add Heritage Site" isBlue icon={''} />
                <ActionButton href="/events/new" label="Add Event" isBlue={false} icon={''} />
                <ActionButton href="/blog-posts/new" label="Write Blog Post" isBlue icon={''} />
                <ActionButton href="/palika-gallery" label="Manage Gallery" isBlue={false} icon={''} />
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </AdminLayout>
  )
}
