'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

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
      // Get admin session from localStorage
      const adminSession = localStorage.getItem('adminSession')
      const admin = adminSession ? JSON.parse(adminSession) : null
      
      // Build query params
      const params = new URLSearchParams()
      if (admin?.palika_id) {
        params.append('palika_id', admin.palika_id)
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
        <div>Loading dashboard...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1>Admin Dashboard</h1>
      
      {stats && (
        <>
          {stats.palika_profile && (
            <div className="card" style={{ marginBottom: '30px', backgroundColor: '#f8f9fa', borderLeft: '4px solid #007bff' }}>
              <h2 style={{ marginTop: 0 }}>Palika Profile</h2>
              
              {/* Basic Info */}
              <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Basic Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Name (English)
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      {stats.palika_profile.name_en}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Name (Nepali)
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                      {stats.palika_profile.name_ne}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Code
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', color: '#007bff' }}>
                      {stats.palika_profile.code}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Type
                    </div>
                    <div style={{ fontSize: '14px', color: '#333', textTransform: 'capitalize' }}>
                      {stats.palika_profile.type?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Province
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.province}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      District
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.district}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Total Wards
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.total_wards || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Status
                    </div>
                    <div style={{ fontSize: '14px', color: stats.palika_profile.is_active ? '#28a745' : '#dc3545' }}>
                      {stats.palika_profile.is_active ? '✓ Active' : '✗ Inactive'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Contact Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Office Phone
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.office_phone || 'Not provided'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Office Email
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.office_email || 'Not provided'}
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Website
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.website ? (
                        <a href={stats.palika_profile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
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
              <div style={{ marginBottom: '25px', paddingBottom: '20px', borderBottom: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Subscription Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Current Tier
                    </div>
                    <div style={{ fontSize: '14px', color: '#333', fontWeight: 'bold' }}>
                      {stats.palika_profile.subscription_tier_display || stats.palika_profile.subscription_tier || 'Not assigned'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Monthly Cost
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.cost_per_month ? `NPR ${stats.palika_profile.cost_per_month}` : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Subscription Start
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.subscription_start_date 
                        ? new Date(stats.palika_profile.subscription_start_date).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Subscription End
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.subscription_end_date 
                        ? new Date(stats.palika_profile.subscription_end_date).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 style={{ marginTop: 0, marginBottom: '15px' }}>System Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Created
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.created_at 
                        ? new Date(stats.palika_profile.created_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '5px' }}>
                      Last Updated
                    </div>
                    <div style={{ fontSize: '14px', color: '#333' }}>
                      {stats.palika_profile.updated_at 
                        ? new Date(stats.palika_profile.updated_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-3" style={{ marginBottom: '30px' }}>
            <div className="card">
              <h3>Heritage Sites</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
                {stats.heritage_sites}
              </div>
            </div>
            
            <div className="card">
              <h3>Events</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                {stats.events}
              </div>
            </div>
            
            <div className="card">
              <h3>Blog Posts</h3>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {stats.blog_posts}
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3>Pending Approvals</h3>
              {stats.pending_approvals > 0 ? (
                <div>
                  <div style={{ fontSize: '18px', color: '#dc3545', marginBottom: '10px' }}>
                    {stats.pending_approvals} items need review
                  </div>
                  <button className="btn btn-primary">Review Pending Items</button>
                </div>
              ) : (
                <div style={{ color: '#28a745' }}>All content approved ✓</div>
              )}
            </div>

            <div className="card">
              <h3>Recent Activity</h3>
              {stats.recent_activity.length > 0 ? (
                <div>
                  {stats.recent_activity.map((item) => (
                    <div key={item.id} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.type}: {item.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#666' }}>No recent activity</div>
              )}
            </div>
          </div>

          <div className="card">
            <h3>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => window.location.href = '/heritage-sites/new'}>
                Add Heritage Site
              </button>
              <button className="btn btn-primary" onClick={() => window.location.href = '/events/new'}>
                Add Event
              </button>
              <button className="btn btn-primary" onClick={() => window.location.href = '/blog-posts/new'}>
                Write Blog Post
              </button>
              <button className="btn btn-secondary" onClick={() => window.location.href = '/media'}>
                Manage Media
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}