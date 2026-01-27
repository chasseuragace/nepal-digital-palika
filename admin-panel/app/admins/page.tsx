'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'

interface AdminRegion {
  id: number
  region_type: 'province' | 'district' | 'palika'
  region_id: number
  assigned_at: string
}

interface AdminUser {
  id: string
  full_name: string
  role: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  province_id: number | null
  district_id: number | null
  palika_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  regions: AdminRegion[]
}

interface ApiResponse {
  data: AdminUser[]
  total: number
  page: number
  limit: number
}

interface DeleteConfirmationState {
  isOpen: boolean
  adminId: string | null
  adminName: string | null
  isDeleting: boolean
  error: string | null
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [hierarchyLevelFilter, setHierarchyLevelFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(10)
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    adminId: null,
    adminName: null,
    isDeleting: false,
    error: null
  })

  useEffect(() => {
    fetchAdmins()
  }, [search, roleFilter, hierarchyLevelFilter, currentPage])

  const fetchAdmins = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', limit.toString())
      if (search) params.append('search', search)
      if (roleFilter) params.append('role_filter', roleFilter)
      if (hierarchyLevelFilter) params.append('hierarchy_level_filter', hierarchyLevelFilter)

      const response = await fetch(`/api/admins?${params.toString()}`)

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized: Please log in')
        } else if (response.status === 403) {
          setError('Forbidden: You do not have permission to view admins')
        } else {
          setError('Failed to fetch admins')
        }
        setAdmins([])
        return
      }

      const data: ApiResponse = await response.json()
      setAdmins(data.data || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error('Error fetching admins:', err)
      setError('Error fetching admins')
      setAdmins([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1) // Reset to first page on search
  }

  const handleRoleFilter = (value: string) => {
    setRoleFilter(value)
    setCurrentPage(1)
  }

  const handleHierarchyLevelFilter = (value: string) => {
    setHierarchyLevelFilter(value)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / limit)

  const getRegionDisplay = (admin: AdminUser): string => {
    if (admin.regions.length === 0) {
      return 'No regions assigned'
    }

    const regionTypes = admin.regions.map(r => r.region_type).join(', ')
    return regionTypes
  }

  const openDeleteConfirmation = (admin: AdminUser) => {
    setDeleteConfirmation({
      isOpen: true,
      adminId: admin.id,
      adminName: admin.full_name,
      isDeleting: false,
      error: null
    })
  }

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      adminId: null,
      adminName: null,
      isDeleting: false,
      error: null
    })
  }

  const handleDeleteAdmin = async () => {
    if (!deleteConfirmation.adminId) return

    try {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: true, error: null }))

      const response = await fetch(`/api/admins/${deleteConfirmation.adminId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete admin')
      }

      // Refresh the admin list
      await fetchAdmins()
      closeDeleteConfirmation()
    } catch (err) {
      console.error('Error deleting admin:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete admin'
      setDeleteConfirmation(prev => ({ ...prev, error: errorMessage, isDeleting: false }))
    }
  }

  if (isLoading && admins.length === 0) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Loading admins...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Admins Management</h1>
        <Link href="/admins/new" className="btn btn-primary">
          Add New Admin
        </Link>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      <div className="card">
        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div className="form-group">
            <label htmlFor="search">Search by Name</label>
            <input
              id="search"
              type="text"
              placeholder="Search admins..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role-filter">Filter by Role</label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => handleRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="province_admin">Province Admin</option>
              <option value="district_admin">District Admin</option>
              <option value="palika_admin">Palika Admin</option>
              <option value="moderator">Moderator</option>
              <option value="support_agent">Support Agent</option>
              <option value="content_editor">Content Editor</option>
              <option value="content_reviewer">Content Reviewer</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hierarchy-filter">Filter by Hierarchy Level</label>
            <select
              id="hierarchy-filter"
              value={hierarchyLevelFilter}
              onChange={(e) => handleHierarchyLevelFilter(e.target.value)}
            >
              <option value="">All Levels</option>
              <option value="national">National</option>
              <option value="province">Province</option>
              <option value="district">District</option>
              <option value="palika">Palika</option>
            </select>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Hierarchy Level</th>
              <th>Regions</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td>{admin.full_name}</td>
                <td>{admin.role}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e7f3ff',
                    color: '#004085',
                    fontSize: '0.9em'
                  }}>
                    {admin.hierarchy_level}
                  </span>
                </td>
                <td>{getRegionDisplay(admin)}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: admin.is_active ? '#d4edda' : '#f8d7da',
                    color: admin.is_active ? '#155724' : '#721c24'
                  }}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(admin.created_at).toLocaleDateString()}</td>
                <td>
                  <Link href={`/admins/${admin.id}`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                    Edit
                  </Link>
                  <Link href={`/admins/${admin.id}/view`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                    View
                  </Link>
                  <button
                    onClick={() => openDeleteConfirmation(admin)}
                    className="btn btn-danger"
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {admins.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {search || roleFilter || hierarchyLevelFilter
              ? 'No admins match your filters.'
              : 'No admins found. Add your first admin!'}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
            <div style={{ color: '#666', fontSize: '0.9em' }}>
              Showing {admins.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} admins
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '400px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
              Delete Admin
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Are you sure you want to delete <strong>{deleteConfirmation.adminName}</strong>? This action cannot be undone.
            </p>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '0.9em' }}>
              All associated region assignments will be automatically removed.
            </p>

            {deleteConfirmation.error && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                border: '1px solid #f5c6cb'
              }}>
                {deleteConfirmation.error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeDeleteConfirmation}
                disabled={deleteConfirmation.isDeleting}
                className="btn btn-secondary"
                style={{ opacity: deleteConfirmation.isDeleting ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAdmin}
                disabled={deleteConfirmation.isDeleting}
                className="btn btn-danger"
                style={{
                  backgroundColor: '#dc3545',
                  color: 'white',
                  opacity: deleteConfirmation.isDeleting ? 0.5 : 1,
                  cursor: deleteConfirmation.isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {deleteConfirmation.isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
