'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService, type ServiceProvider } from '@/lib/client/sos-client.service'
import './providers.css'

export default function SOSProvidersPage() {
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [filteredProviders, setFilteredProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [serviceTypeFilter, setServiceTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchProviders()
  }, [])

  useEffect(() => {
    filterProviders()
  }, [providers, search, serviceTypeFilter, statusFilter])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await sosClientService.getProviders()
      setProviders(response.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers')
    } finally {
      setLoading(false)
    }
  }

  const filterProviders = () => {
    let filtered = providers

    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name_en.toLowerCase().includes(lowerSearch) ||
        p.phone.includes(search)
      )
    }

    if (serviceTypeFilter) {
      filtered = filtered.filter(p => p.service_type === serviceTypeFilter)
    }

    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter)
    }

    setFilteredProviders(filtered)
  }

  const handleDelete = async () => {
    if (!deletingId) return

    try {
      setError('')
      await sosClientService.deleteProvider(deletingId)
      setShowDeleteDialog(false)
      setDeletingId(null)
      await fetchProviders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'status-available'
      case 'busy': return 'status-busy'
      case 'offline': return 'status-offline'
      case 'suspended': return 'status-suspended'
      default: return 'status-offline'
    }
  }

  const stats = {
    total: providers.length,
    available: providers.filter(p => p.status === 'available').length,
    busy: providers.filter(p => p.status === 'busy').length,
    offline: providers.filter(p => p.status === 'offline').length,
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading service providers...</p>
        </div>
      </AdminLayout>
    )
  }

  const serviceTypes = ['ambulance', 'fire_brigade', 'police', 'rescue', 'disaster_management']

  return (
    <AdminLayout>
      <div className="providers-container">
        <div className="providers-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Service Providers</h1>
              <p className="page-subtitle">Manage emergency service providers</p>
            </div>
          </div>
          <Link href="/sos/providers/new" className="providers-header-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            New Provider
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div 
            className={`stat-card ${statusFilter === '' ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon total">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Providers</div>
            </div>
          </div>

          <div 
            className={`stat-card ${statusFilter === 'available' ? 'active' : ''}`}
            onClick={() => setStatusFilter('available')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon available">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.available}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>

          <div 
            className={`stat-card ${statusFilter === 'busy' ? 'active' : ''}`}
            onClick={() => setStatusFilter('busy')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon busy">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.busy}</div>
              <div className="stat-label">Busy</div>
            </div>
          </div>

          <div 
            className={`stat-card ${statusFilter === 'offline' ? 'active' : ''}`}
            onClick={() => setStatusFilter('offline')}
            style={{ cursor: 'pointer' }}
          >
            <div className="stat-icon offline">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.offline}</div>
              <div className="stat-label">Offline</div>
            </div>
          </div>
        </div>

        <div className="providers-content-card">
          {/* Error Message */}
          {error && (
            <div className="error-banner">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select 
                value={serviceTypeFilter} 
                onChange={(e) => setServiceTypeFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
                  </option>
                ))}
              </select>

              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-info">
            Showing <strong>{filteredProviders.length}</strong> of <strong>{providers.length}</strong> service providers
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="providers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Assignments</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((provider) => (
                  <tr key={provider.id}>
                    <td>
                      <div className="provider-name-cell">
                        <div className="provider-name-english">{provider.name_en}</div>
                        {provider.name_ne && (
                          <div className="provider-name-nepali">{provider.name_ne}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="service-type-badge">
                        {provider.service_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className="phone-number">{provider.phone}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusColor(provider.status)}`}>
                        {provider.status}
                      </span>
                    </td>
                    <td>
                      <div className="rating-cell">
                        <span className="rating-value">{provider.rating_average.toFixed(1)}</span>
                        <span className="rating-star">⭐</span>
                      </div>
                    </td>
                    <td>
                      <span className="assignments-badge">{provider.total_assignments}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => {
                            setDeletingId(provider.id)
                            setShowDeleteDialog(true)
                          }}
                          className="btn-icon btn-delete"
                          title="Delete Provider"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProviders.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h3 className="empty-state-title">
                {search || serviceTypeFilter || statusFilter 
                  ? 'No providers match your filters' 
                  : 'No service providers yet'}
              </h3>
              <p className="empty-state-description">
                {search || serviceTypeFilter || statusFilter
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first service provider'}
              </p>
              {!search && !serviceTypeFilter && !statusFilter && (
                <Link href="/sos/providers/new" className="btn btn-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add First Provider
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Delete Dialog */}
        {showDeleteDialog && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Delete Provider?</h3>
                <button onClick={() => {
                  setShowDeleteDialog(false)
                  setDeletingId(null)
                }} className="modal-close">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <p className="modal-description">
                Are you sure you want to delete this provider? This action cannot be undone.
              </p>
              <div className="modal-actions">
                <button onClick={handleDelete} className="btn btn-danger">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete Provider
                </button>
                <button
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setDeletingId(null)
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
