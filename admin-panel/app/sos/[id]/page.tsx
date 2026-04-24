'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService, type SOSRequest, type ServiceProvider, type SOSAssignment } from '@/lib/client/sos-client.service'
import './sos-detail.css'

export default function SOSDetailPage() {
  const params = useParams()
  const router = useRouter()
  const requestId = params.id as string

  const [request, setRequest] = useState<SOSRequest | null>(null)
  const [providers, setProviders] = useState<ServiceProvider[]>([])
  const [assignments, setAssignments] = useState<SOSAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [resolutionNotes, setResolutionNotes] = useState('')
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [assignmentNotes, setAssignmentNotes] = useState('')
  const [estimatedArrival, setEstimatedArrival] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [requestId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [requestRes, providersRes, assignmentsRes] = await Promise.all([
        sosClientService.getRequestById(requestId),
        sosClientService.getProviders(),
        sosClientService.getAssignments(requestId),
      ])
      setRequest(requestRes)
      setProviders(providersRes.data || [])
      setAssignments(assignmentsRes.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStatus) {
      setError('Please select a status')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await sosClientService.updateRequestStatus(requestId, newStatus, resolutionNotes)
      setShowStatusModal(false)
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
    if (!selectedProviderId) {
      setError('Please select a provider')
      return
    }

    try {
      setSubmitting(true)
      setError('')
      await sosClientService.createAssignment(requestId, selectedProviderId, assignmentNotes, estimatedArrival ? parseInt(estimatedArrival) : undefined)
      setShowAssignModal(false)
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading SOS request details...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!request) {
    return (
      <AdminLayout>
        <div className="sos-detail-container">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h3 className="empty-state-title">SOS Request Not Found</h3>
            <p className="empty-state-description">The requested SOS emergency could not be found</p>
            <Link href="/sos" className="btn btn-primary">
              Back to SOS Requests
            </Link>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="sos-detail-container">
        {/* Header */}
        <div className="detail-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div>
              <h1 className="page-title">{request.request_code}</h1>
              <p className="page-subtitle">{request.emergency_type.toUpperCase()} Emergency</p>
            </div>
          </div>
          <Link href="/sos" className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to List
          </Link>
        </div>

        {/* Error Banner */}
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

        {/* Request Details Card */}
        <div className="detail-card">
          <div className="card-header">
            <h2 className="card-title">Request Details</h2>
            <div className="card-badges">
              <span className={`status-badge status-${request.status.replace(/_/g, '-')}`}>
                {request.status.replace(/_/g, ' ')}
              </span>
              <span className={`priority-badge priority-${request.priority || 'none'}`}>
                {request.priority || 'No Priority'}
              </span>
            </div>
          </div>

          <div className="detail-grid">
            <div className="detail-item">
              <div className="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
                Emergency Type
              </div>
              <div className="detail-value">{request.emergency_type}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
                Caller
              </div>
              <div className="detail-value">
                {request.is_anonymous ? (
                  <span className="anonymous-badge">Anonymous</span>
                ) : (
                  request.user_name || 'Unknown'
                )}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Phone Number
              </div>
              <div className="detail-value phone-number">{request.user_phone}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Created At
              </div>
              <div className="detail-value">{new Date(request.created_at).toLocaleString()}</div>
            </div>
          </div>

          <div className="detail-section">
            <div className="detail-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              Location
            </div>
            <div className="detail-value">{request.location_description}</div>
          </div>

          {request.details && (
            <div className="detail-section">
              <div className="detail-label">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Additional Details
              </div>
              <div className="detail-value">{request.details}</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-bar">
          <button onClick={() => setShowStatusModal(true)} className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Update Status
          </button>
          <button onClick={() => setShowAssignModal(true)} className="btn btn-success">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <line x1="19" y1="8" x2="19" y2="14"></line>
              <line x1="22" y1="11" x2="16" y2="11"></line>
            </svg>
            Assign Provider
          </button>
        </div>

        {/* Assignments Card */}
        <div className="detail-card">
          <div className="card-header">
            <h2 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Assignments ({assignments.length})
            </h2>
          </div>

          {assignments.length === 0 ? (
            <div className="empty-assignments">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
              <p>No service providers assigned yet</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="assignments-table">
                <thead>
                  <tr>
                    <th>Assignment ID</th>
                    <th>Status</th>
                    <th>ETA (minutes)</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(assignment => (
                    <tr key={assignment.id}>
                      <td>
                        <span className="assignment-id">{assignment.id.slice(0, 8)}</span>
                      </td>
                      <td>
                        <span className={`status-badge status-${assignment.status.replace(/_/g, '-')}`}>
                          {assignment.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="eta-badge">
                          {assignment.estimated_arrival_minutes || '-'}
                        </span>
                      </td>
                      <td>{new Date(assignment.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Modal */}
        {showStatusModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Update Status</h3>
                <button onClick={() => setShowStatusModal(false)} className="modal-close">
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
        {showAssignModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">Assign Service Provider</h3>
                <button onClick={() => setShowAssignModal(false)} className="modal-close">
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
