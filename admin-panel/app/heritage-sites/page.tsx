'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { heritageSitesService, type HeritageSite } from '@/lib/client/heritage-sites-client.service'
import './heritage-sites.css'

export default function HeritageSitesPage() {
  const [sites, setSites] = useState<HeritageSite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchHeritageSites()
  }, [])

  const fetchHeritageSites = async () => {
    try {
      const result = await heritageSitesService.getAll()
      setSites(result.data)
    } catch (error) {
      console.error('Error fetching heritage sites:', error)
      setSites([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name_en?.toLowerCase().includes(filter.toLowerCase()) ||
      site.name_ne?.includes(filter) ||
      site.site_type?.toLowerCase().includes(filter.toLowerCase())

    const matchesStatus = statusFilter === 'all' || site.status === statusFilter
    const matchesType = typeFilter === 'all' || site.site_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: sites.length,
    active: sites.filter(s => s.status === 'Active').length,
    renovation: sites.filter(s => s.status === 'Under Renovation').length,
    restricted: sites.filter(s => s.status === 'Restricted').length
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading heritage sites...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="heritage-container">
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Heritage Sites</h1>
              <p className="page-subtitle">Manage and preserve cultural heritage locations</p>
            </div>
          </div>
          <Link href="/heritage-sites/new" className="btn btn-primary header-add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add New Site
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon total">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Sites</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.active}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon renovation">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.renovation}</div>
              <div className="stat-label">Under Renovation</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon restricted">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.restricted}</div>
              <div className="stat-label">Restricted</div>
            </div>
          </div>
        </div>

        <div className="heritage-content-card">
          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search by name or category..."
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
                <option value="Active">Active</option>
                <option value="Under Renovation">Under Renovation</option>
                <option value="Restricted">Restricted</option>
              </select>

              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="Religious">Religious</option>
                <option value="Historical">Historical</option>
                <option value="Cultural">Cultural</option>
                <option value="Archaeological">Archaeological</option>
                <option value="Natural">Natural</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-info">
            Showing <strong>{filteredSites.length}</strong> of <strong>{sites.length}</strong> heritage sites
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="heritage-table">
              <thead>
                <tr>
                  <th>Site Name</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSites.map((site) => (
                  <tr key={site.id}>
                    <td>
                      <div className="site-name-cell">
                        <div className="site-name-english">{site.name_en}</div>
                        <div className="site-name-nepali">{site.name_ne}</div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{site.category_name || 'Uncategorized'}</span>
                    </td>
                    <td>{site.site_type}</td>
                    <td>
                      <span className={`status-badge status-${site.status.toLowerCase().replace(' ', '-')}`}>
                        {site.status}
                      </span>
                    </td>
                    <td>{site.palika_name}</td>
                    <td>{new Date(site.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <Link href={`/heritage-sites/${site.id}`} className="btn-icon" title="Edit">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                          </svg>
                        </Link>
                        <Link href={`/heritage-sites/${site.id}/view`} className="btn-icon" title="View">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSites.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                  <path d="M4 22h16"></path>
                  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                </svg>
              </div>
              <h3 className="empty-state-title">
                {filter || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'No heritage sites match your filters' 
                  : 'No heritage sites yet'}
              </h3>
              <p className="empty-state-description">
                {filter || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first heritage site'}
              </p>
              {!filter && statusFilter === 'all' && typeFilter === 'all' && (
                <Link href="/heritage-sites/new" className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add First Heritage Site
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}