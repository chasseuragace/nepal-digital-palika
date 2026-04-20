'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserPlus,
  Shield,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import './admins.css'

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
  admin: AdminUser | null
  isDeleting: boolean
  error: string | null
}

export default function AdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [hierarchyLevelFilter, setHierarchyLevelFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(10)
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    admin: null,
    isDeleting: false,
    error: null,
  })

  useEffect(() => {
    fetchAdmins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setCurrentPage(1)
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
    if (!admin.regions || admin.regions.length === 0) {
      return admin.hierarchy_level === 'national' ? 'National (all regions)' : 'No regions assigned'
    }
    const counts: Record<string, number> = {}
    admin.regions.forEach((r) => {
      counts[r.region_type] = (counts[r.region_type] || 0) + 1
    })
    return Object.entries(counts)
      .map(([type, count]) => `${count} ${type}${count !== 1 ? 's' : ''}`)
      .join(', ')
  }

  const openDeleteConfirmation = (admin: AdminUser) => {
    setDeleteConfirmation({
      isOpen: true,
      admin,
      isDeleting: false,
      error: null,
    })
  }

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      admin: null,
      isDeleting: false,
      error: null,
    })
  }

  const handleDeleteAdmin = async () => {
    if (!deleteConfirmation.admin) return

    try {
      setDeleteConfirmation((prev) => ({ ...prev, isDeleting: true, error: null }))

      const response = await fetch(`/api/admins/${deleteConfirmation.admin.id}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete admin')
      }

      const deletedName = deleteConfirmation.admin.full_name
      closeDeleteConfirmation()
      setMessage({ type: 'success', text: `${deletedName} has been removed successfully` })
      await fetchAdmins()
    } catch (err) {
      console.error('Error deleting admin:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete admin'
      setDeleteConfirmation((prev) => ({ ...prev, error: errorMessage, isDeleting: false }))
    }
  }

  const getRoleBadgeClass = (role: string) => {
    // Map backend role values to CSS classes
    return role.replace(/_/g, '-')
  }

  if (isLoading && admins.length === 0) {
    return (
      <AdminLayout>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
          }}
        >
          <div className="spinner" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="admins-container">
        {/* Page Header */}
        <div className="admins-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <Users size={32} />
            </div>
            <div>
              <h1 className="page-title">Admin Management</h1>
              <p className="page-subtitle">Manage admin users, roles, and regional assignments</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => router.push('/permissions')}
            >
              <Shield size={18} />
              Manage Permissions
            </button>
            <button
              className="btn btn-primary header-add-btn"
              onClick={() => router.push('/admins/new')}
            >
              <UserPlus size={18} />
              Add New Admin
            </button>
          </div>
        </div>

        <div className="admins-content">
          {/* Message Alert */}
          {message && (
            <div className={`message-alert ${message.type}`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              {message.text}
            </div>
          )}

          {error && (
            <div className="message-alert error">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard
              label="Total Admins"
              value={totalCount}
              icon={<Users size={20} />}
              color="#3b82f6"
              description="All admin accounts"
            />
            <StatCard
              label="Active"
              value={admins.filter((a) => a.is_active).length}
              icon={<CheckCircle size={20} />}
              color="#10b981"
              description="On this page"
            />
            <StatCard
              label="Inactive"
              value={admins.filter((a) => !a.is_active).length}
              icon={<XCircle size={20} />}
              color="#ef4444"
              description="On this page"
            />
            <StatCard
              label="Palika-level"
              value={admins.filter((a) => a.hierarchy_level === 'palika').length}
              icon={<Shield size={20} />}
              color="#f59e0b"
              description="On this page"
            />
          </div>

          {/* Filters */}
          <div className="filters-card">
            <div className="filters-header">
              <div className="filters-title">
                <Filter size={18} />
                <span>Filters</span>
              </div>

              <div className="filter-controls">
                <div className="search-input-wrapper">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search admins by name..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="palika_admin">Palika Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="support">Support</option>
                </select>

                <select
                  value={hierarchyLevelFilter}
                  onChange={(e) => handleHierarchyLevelFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Levels</option>
                  <option value="national">National</option>
                  <option value="province">Province</option>
                  <option value="district">District</option>
                  <option value="palika">Palika</option>
                </select>
              </div>
            </div>

            <div className="results-info">
              <Info size={16} />
              <span>
                {totalCount} admin{totalCount !== 1 ? 's' : ''} total
                {(search || roleFilter || hierarchyLevelFilter) && ' • Filters applied'}
              </span>
            </div>
          </div>

          {/* Admins Table */}
          <div className="admins-table-card">
            <div className="table-container">
              <table className="admins-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Role</th>
                    <th>Hierarchy</th>
                    <th>Regions</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <tr key={admin.id}>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">
                              {admin.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="user-info">
                              <div className="user-name">{admin.full_name}</div>
                              <div className="user-email">ID: {admin.id.substring(0, 8)}…</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${getRoleBadgeClass(admin.role)}`}>
                            {admin.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className="hierarchy-badge">{admin.hierarchy_level}</span>
                        </td>
                        <td>{getRegionDisplay(admin)}</td>
                        <td>
                          <span
                            className={`status-badge ${admin.is_active ? 'active' : 'inactive'}`}
                          >
                            {admin.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div className="date-cell">
                            <div className="date-primary">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </div>
                            <div className="date-secondary">
                              {new Date(admin.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="action-btn"
                              onClick={() => router.push(`/admins/${admin.id}`)}
                              title="View Admin"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              className="action-btn"
                              onClick={() => router.push(`/admins/${admin.id}`)}
                              title="Edit Admin"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => openDeleteConfirmation(admin)}
                              title="Delete Admin"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="empty-state">
                          <Users size={48} className="empty-state-icon" />
                          <div className="empty-state-title">
                            {search || roleFilter || hierarchyLevelFilter
                              ? 'No admins match your filters'
                              : 'No admins found'}
                          </div>
                          <div className="empty-state-description">
                            {search || roleFilter || hierarchyLevelFilter
                              ? 'Try adjusting your search or filters'
                              : 'Add your first admin to get started'}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination-bar">
                <div className="pagination-info">
                  Showing {admins.length > 0 ? (currentPage - 1) * limit + 1 : 0} to{' '}
                  {Math.min(currentPage * limit, totalCount)} of {totalCount} admins
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{
                      opacity: currentPage === 1 ? 0.5 : 1,
                      cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Previous
                  </button>
                  <span className="pagination-page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{
                      opacity: currentPage === totalPages ? 0.5 : 1,
                      cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && deleteConfirmation.admin && (
        <div className="modal-overlay" onClick={closeDeleteConfirmation}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-danger">
                <AlertCircle size={24} />
              </div>
              <h3 className="modal-title">Delete Admin</h3>
            </div>
            <div className="modal-body">
              <p className="modal-text">
                Are you sure you want to delete{' '}
                <strong>{deleteConfirmation.admin.full_name}</strong>?
              </p>
              <p className="modal-warning">
                This action cannot be undone. All region assignments will be removed, and the admin
                will lose access to the platform.
              </p>
              {deleteConfirmation.error && (
                <div
                  className="message-alert error"
                  style={{ marginTop: '16px', marginBottom: 0 }}
                >
                  <AlertCircle size={20} />
                  {deleteConfirmation.error}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={closeDeleteConfirmation}
                disabled={deleteConfirmation.isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteAdmin}
                disabled={deleteConfirmation.isDeleting}
              >
                <Trash2 size={16} />
                {deleteConfirmation.isDeleting ? 'Deleting…' : 'Delete Admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

// ─── Sub-components ───

function StatCard({
  label,
  value,
  icon,
  color,
  description,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  description?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {description && (
          <div className="stat-description">
            <Info size={10} />
            {description}
          </div>
        )}
      </div>
    </div>
  )
}
