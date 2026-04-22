'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService, type ServiceProvider } from '@/lib/client/sos-client.service'
import { Badge } from '@/components/ui/badge'

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
      case 'available': return 'bg-green-100 text-green-800'
      case 'busy': return 'bg-yellow-100 text-yellow-800'
      case 'offline': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const serviceTypes = ['ambulance', 'fire_brigade', 'police', 'rescue', 'disaster_management']

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Providers</h1>
              <p className="text-gray-600 mt-2">Manage emergency service providers</p>
            </div>
            <Link href="/sos/providers/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              New Provider
            </Link>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search by name or phone..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <select
                value={serviceTypeFilter}
                onChange={e => setServiceTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
                <option value="suspended">Suspended</option>
              </select>
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
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="text-gray-600">No providers found</div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Assignments</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProviders.map(provider => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">{provider.name_en}</td>
                      <td className="px-6 py-3 text-sm text-gray-700 capitalize">
                        {provider.service_type.replace(/_/g, ' ')}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700 font-mono">{provider.phone}</td>
                      <td className="px-6 py-3">
                        <Badge className={getStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {provider.rating_average.toFixed(1)} ⭐
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {provider.total_assignments}
                      </td>
                      <td className="px-6 py-3 text-sm space-x-2">
                        <button
                          onClick={() => {
                            setDeletingId(provider.id)
                            setShowDeleteDialog(true)
                          }}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-2">Delete Provider?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this provider? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeletingId(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
