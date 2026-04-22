'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService, type SOSRequest, type SOSStats } from '@/lib/client/sos-client.service'
import { Badge } from '@/components/ui/badge'

export default function SOSPage() {
  const [requests, setRequests] = useState<SOSRequest[]>([])
  const [stats, setStats] = useState<SOSStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError('')
      const [requestsRes, statsRes] = await Promise.all([
        sosClientService.getRequests(1, statusFilter || undefined, search || undefined),
        sosClientService.getStats(),
      ])
      setRequests(requestsRes.data || [])
      setStats(statsRes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">SOS Emergency Management</h1>
            <p className="text-gray-600 mt-2">Manage emergency SOS requests and service providers</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold">{stats.resolved + stats.pending + stats.assigned + stats.in_progress}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Assigned</div>
                <div className="text-2xl font-bold text-purple-600">{stats.assigned}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">In Progress</div>
                <div className="text-2xl font-bold text-indigo-600">{stats.in_progress}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Resolved</div>
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="text-sm text-gray-600">Completion</div>
                <div className="text-2xl font-bold">{stats.completion_rate}%</div>
              </div>
            </div>
          )}

          {/* Filters & Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by request code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Link href="/sos/providers" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Manage Providers
              </Link>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          {/* List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading...</div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-600">No SOS requests found</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Request</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Caller</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Priority</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-mono text-gray-900">{req.request_code}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">{req.emergency_type}</td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {req.is_anonymous ? 'Anonymous' : req.user_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-3">
                        <Badge className={getStatusColor(req.status)}>
                          {req.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className={`px-6 py-3 text-sm ${getPriorityColor(req.priority)}`}>
                        {req.priority || '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <Link href={`/sos/${req.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
