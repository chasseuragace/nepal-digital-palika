'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface DashboardStats {
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
      const response = await fetch('/api/dashboard/stats')
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