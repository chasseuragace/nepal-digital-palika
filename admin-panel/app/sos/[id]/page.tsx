'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService, type SOSRequest, type ServiceProvider, type SOSAssignment } from '@/lib/client/sos-client.service'
import { Badge } from '@/components/ui/badge'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewing': return 'bg-blue-100 text-blue-800'
      case 'assigned': return 'bg-purple-100 text-purple-800'
      case 'in_progress': return 'bg-indigo-100 text-indigo-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 font-bold'
      case 'high': return 'text-orange-600 font-semibold'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!request) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-600">SOS request not found</div>
              <Link href="/sos" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                Back to SOS Requests
              </Link>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{request.request_code}</h1>
              <p className="text-gray-600 mt-2">{request.emergency_type.toUpperCase()}</p>
            </div>
            <Link href="/sos" className="text-blue-600 hover:text-blue-800">
              Back
            </Link>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          {/* Request Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-gray-600">Priority</div>
                <div className={`text-lg font-semibold ${getPriorityColor(request.priority)}`}>
                  {request.priority || '-'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Type</div>
                <div className="text-lg font-semibold">{request.emergency_type}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Caller</div>
                <div className="text-lg">{request.is_anonymous ? 'Anonymous' : request.user_name || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Phone</div>
                <div className="text-lg font-mono">{request.user_phone}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="text-lg">{new Date(request.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">Location</div>
              <div className="text-lg mt-1">{request.location_description}</div>
            </div>

            {request.details && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">Details</div>
                <div className="text-lg mt-1">{request.details}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Update Status
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Assign Provider
            </button>
          </div>

          {/* Assignments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Assignments ({assignments.length})</h2>
            </div>

            {assignments.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                No assignments yet
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">ETA (min)</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assignments.map(assignment => (
                    <tr key={assignment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm text-gray-900">
                        Assignment {assignment.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <Badge className="bg-blue-100 text-blue-800">
                          {assignment.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {assignment.estimated_arrival_minutes || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(assignment.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Status Modal */}
          {showStatusModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Update Status</h3>
                <form onSubmit={handleStatusUpdate}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
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
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resolution Notes
                      </label>
                      <textarea
                        value={resolutionNotes}
                        onChange={e => setResolutionNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        rows={3}
                        placeholder="Optional notes about resolution..."
                      />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Updating...' : 'Update'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusModal(false)
                        setNewStatus('')
                        setResolutionNotes('')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300"
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-bold mb-4">Assign Provider</h3>
                <form onSubmit={handleCreateAssignment}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Provider
                    </label>
                    <select
                      value={selectedProviderId}
                      onChange={e => setSelectedProviderId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select provider</option>
                      {providers.map(provider => (
                        <option key={provider.id} value={provider.id}>
                          {provider.name_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Arrival (minutes)
                    </label>
                    <input
                      type="number"
                      value={estimatedArrival}
                      onChange={e => setEstimatedArrival(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., 10"
                      min="0"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={assignmentNotes}
                      onChange={e => setAssignmentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      rows={3}
                      placeholder="Optional assignment notes..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Assigning...' : 'Assign'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignModal(false)
                        setSelectedProviderId('')
                        setAssignmentNotes('')
                        setEstimatedArrival('')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
