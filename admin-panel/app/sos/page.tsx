'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService, type SOSRequest, type SOSStats, type ServiceProvider } from '@/lib/client/sos-client.service'
import './sos.css'

export default function SOSPage() {
  const [requests, setRequests] = useState<SOSRequest[]>([])
  const [stats, setStats] = useState<SOSStats | null>(null)
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [error, setError] = useState('')
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<SOSRequest | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [estimatedArrival, setEstimatedArrival] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [requestsRes, statsRes, providersRes] = await Promise.all([
        sosClientService.getRequests(1, statusFilter || undefined, search || undefined),
        sosClientService.getStats(),
        sosClientService.getProviders(),
      ])
      setRequests(requestsRes.data || [])
      setStats(statsRes)
      setProviders(providersRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus || !selectedRequest) {
      setError('Please select a status')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await sosClientService.updateRequestStatus(selectedRequest.id, newStatus, resolutionNotes)
      setShowStatusModal(false)
      setSelectedRequest(null)
      setNewStatus('')
      setResolutionNotes('')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProviderId || !selectedRequest) {
      setError('Please select a provider')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await sosClientService.createAssignment(selectedRequest.id, selectedProviderId, assignmentNotes, estimatedArrival ? parseInt(estimatedArrival) : undefined)
      setShowAssignModal(false)
      setSelectedRequest(null)
      setSelectedProviderId('')
      setAssignmentNotes('')
      setEstimatedArrival('')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  const openStatusModal = (req: SOSRequest) => {
    setSelectedRequest(req)
    setNewStatus(req.status)
    setShowStatusModal(true)
  }

  const openAssignModal = (req: SOSRequest) => {
    setSelectedRequest(req)
    setShowAssignModal(true)
  }

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.request_code?.toLowerCase().includes(search.toLowerCase()) ||
      req.emergency_type?.toLowerCase().includes(search.toLowerCase()) ||
      req.user_name?.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  const totalRequests = stats ? stats.resolved + stats.pending + stats.assigned + stats.in_progress : 0

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading SOS requests...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="sos-container">
        <div className="sos-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <h1 className="page-title">SOS Emergency Management</h1>
              <p className="page-subtitle">Manage emergency SOS requests and service providers</p>
            </div>
          </div>
          <Link href="/sos/providers" className="btn btn-primary header-add-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Manage Providers
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div 
              className={`stat-card ${statusFilter === '' ? 'active' : ''}`}
              onClick={() => setStatusFilter('')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon total">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{totalRequests}</div>
                <div className="stat-label">Total Requests</div>
              </div>
            </div>

            <div 
              className={`stat-card ${statusFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setStatusFilter('pending')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon pending">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending</div>
              </div>
            </div>

            <div 
              className={`stat-card ${statusFilter === 'assigned' ? 'active' : ''}`}
              onClick={() => setStatusFilter('assigned')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon assigned">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.assigned}</div>
                <div className="stat-label">Assigned</div>
              </div>
            </div>

            <div 
              className={`stat-card ${statusFilter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setStatusFilter('in_progress')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon in-progress">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4"></path>
                  <path d="m16.2 7.8 2.9-2.9"></path>
                  <path d="M18 12h4"></path>
                  <path d="m16.2 16.2 2.9 2.9"></path>
                  <path d="M12 18v4"></path>
                  <path d="m4.9 19.1 2.9-2.9"></path>
                  <path d="M2 12h4"></path>
                  <path d="m4.9 4.9 2.9 2.9"></path>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.in_progress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>

            <div 
              className={`stat-card ${statusFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setStatusFilter('resolved')}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon resolved">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.resolved}</div>
                <div className="stat-label">Resolved</div>
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'default', opacity: 0.7 }}>
              <div className="stat-icon completion">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-value">{stats.completion_rate}%</div>
                <div className="stat-label">Completion Rate</div>
              </div>
            </div>
          </div>
        )}

        <div className="sos-content-card">
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
                placeholder="Search by request code, type, or caller..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-group">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="results-info">
            Showing <strong>{filteredRequests.length}</strong> of <strong>{requests.length}</strong> SOS requests
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="sos-table">
              <thead>
                <tr>
                  <th>Request Code</th>
                  <th>Emergency Type</th>
                  <th>Caller</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span className="request-code">{req.request_code}</span>
                    </td>
                    <td>
                      <span className="emergency-type">{req.emergency_type}</span>
                    </td>
                    <td>
                      {req.is_anonymous ? (
                        <span className="anonymous-badge">Anonymous</span>
                      ) : (
                        <span>{req.user_name || 'Unknown'}</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge status-${req.status.replace(/_/g, '-')}`}>
                        {req.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`priority-badge priority-${req.priority || 'none'}`}>
                        {req.priority || '-'}
                      </span>
                    </td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="action-buttons">
                        <Link href={`/sos/${req.id}`} className="btn-icon btn-view" title="View Details">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Link>
                        <button onClick={() => openStatusModal(req)} className="btn-icon btn-status" title="Update Status">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button onClick={() => openAssignModal(req)} className="btn-icon btn-assign" title="Assign Provider">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <line x1="19" y1="8" x2="19" y2="14"></line>
                            <line x1="22" y1="11" x2="16" y2="11"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h3 className="empty-state-title">
                {search || statusFilter 
                  ? 'No SOS requests match your filters' 
                  : 'No SOS requests yet'}
              </h3>
              <p className="empty-state-description">
                {search || statusFilter
                  ? 'Try adjusting your search or filter criteria'
                  : 'Emergency requests will appear here when submitted'}
              </p>
            </div>
          )}
        </div>

        {/* Status Modal */}
        {showStatusModal && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Update Status - {selectedRequest.request_code}</h3>
                <button onClick={() => {
                  setShowStatusModal(false)
                  setSelectedRequest(null)
                  setNewStatus('')
                  setResolutionNotes('')
                }} className="modal-close">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="form-select">
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {newStatus === 'resolved' && (
                  <div className="form-group">
                    <label className="form-label">Resolution Notes</label>
                    <textarea
                      value={resolutionNotes}
                      onChange={e => setResolutionNotes(e.target.value)}
                      className="form-textarea"
                      rows={3}
                      placeholder="Optional notes about resolution..."
                    />
                  </div>
                )}

                <div className="modal-actions">
                  <button type="submit" disabled={submitting} className="btn btn-primary">
                    {submitting ? 'Updating...' : 'Update Status'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowStatusModal(false)
                      setSelectedRequest(null)
                      setNewStatus('')
                      setResolutionNotes('')
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedRequest && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Assign Provider - {selectedRequest.request_code}</h3>
                <button onClick={() => {
                  setShowAssignModal(false)
                  setSelectedRequest(null)
                  setSelectedProviderId('')
                  setAssignmentNotes('')
                  setEstimatedArrival('')
                }} className="modal-close">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <form onSubmit={handleCreateAssignment}>
                <div className="form-group">
                  <label className="form-label">Service Provider</label>
                  <select
                    value={selectedProviderId}
                    onChange={e => setSelectedProviderId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Select provider</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Estimated Arrival (minutes)</label>
                  <input
                    type="number"
                    value={estimatedArrival}
                    onChange={e => setEstimatedArrival(e.target.value)}
                    className="form-input"
                    placeholder="e.g., 10"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    value={assignmentNotes}
                    onChange={e => setAssignmentNotes(e.target.value)}
                    className="form-textarea"
                    rows={3}
                    placeholder="Optional assignment notes..."
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" disabled={submitting} className="btn btn-success">
                    {submitting ? 'Assigning...' : 'Assign Provider'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedRequest(null)
                      setSelectedProviderId('')
                      setAssignmentNotes('')
                      setEstimatedArrival('')
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
