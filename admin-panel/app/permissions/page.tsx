'use client'

import { useEffect, useState } from 'react'
import { Shield, ChevronDown, ChevronRight, Filter, Info, CheckCircle, AlertCircle } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'
import { permissionsService, type Permission } from '@/lib/client/permissions-client.service'
import { rolesService, type Role as ServiceRole } from '@/lib/client/roles-client.service'
import './permissions.css'

interface Role {
  id: number
  name: string
  hierarchy_level: string
}

interface PermissionWithRoles extends Permission {
  roles: Role[]
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<PermissionWithRoles[]>([])
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resourceFilter, setResourceFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(20)
  const [expandedPermission, setExpandedPermission] = useState<number | null>(null)
  const [assigningRoles, setAssigningRoles] = useState<Record<number, Set<number>>>({})

  useEffect(() => {
    fetchPermissionsAndRoles()
  }, [resourceFilter, currentPage])

  const fetchPermissionsAndRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch permissions and all roles in parallel
      const [permData, rolesData] = await Promise.all([
        permissionsService.getAll(),
        rolesService.getAll({ limit: 1000 })
      ])

      const allPermissions = permData.data || []
      const rolesList = (rolesData.data || []) as ServiceRole[]

      setAllRoles(rolesList.map(r => ({
        id: r.id,
        name: r.name,
        hierarchy_level: r.hierarchy_level
      })))

      // Map each permission to roles that have it (roles already include permissions array)
      const permissionsWithRoles: PermissionWithRoles[] = allPermissions.map(perm => {
        const rolesWithPerm: Role[] = rolesList
          .filter(role => role.permissions?.some(p => p.id === perm.id))
          .map(role => ({
            id: role.id,
            name: role.name,
            hierarchy_level: role.hierarchy_level
          }))

        return {
          ...perm,
          roles: rolesWithPerm
        }
      })

      setPermissions(permissionsWithRoles)
      setTotalCount(permData.total || allPermissions.length)
    } catch (err) {
      console.error('Error fetching permissions:', err)
      setError('Error fetching permissions')
      setPermissions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResourceFilter = (value: string) => {
    setResourceFilter(value)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / limit)

  // Get unique resources
  const resources = Array.from(new Set(permissions.map(p => p.resource)))

  if (isLoading && permissions.length === 0) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="permissions-container">
        {/* Page Header */}
        <div className="permissions-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <Shield size={32} />
            </div>
            <div>
              <h1 className="page-title">Permissions Management</h1>
              <p className="page-subtitle">Manage system permissions and role assignments</p>
            </div>
          </div>
        </div>

        <div className="permissions-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <StatCard 
              label="Total Permissions" 
              value={totalCount} 
              icon={<Shield size={20} />} 
              color="#3b82f6" 
              description="All system permissions"
            />
            <StatCard 
              label="Resources" 
              value={resources.length} 
              icon={<Filter size={20} />} 
              color="#10b981" 
              description="Unique resources"
            />
            <StatCard 
              label="Roles" 
              value={allRoles.length} 
              icon={<CheckCircle size={20} />} 
              color="#8b5cf6" 
              description="System roles"
            />
            <StatCard 
              label="Filtered Results" 
              value={permissions.length} 
              icon={<Info size={20} />} 
              color="#f59e0b" 
              description="Current view"
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
                <select
                  value={resourceFilter}
                  onChange={(e) => handleResourceFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Resources</option>
                  {resources.map(resource => (
                    <option key={resource} value={resource}>
                      {resource.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="results-info">
              <Info size={16} />
              <span>
                {permissions.length} permission{permissions.length !== 1 ? 's' : ''} found
                {resourceFilter && ' • Filter applied'}
              </span>
            </div>
          </div>

          {/* Permissions List */}
          <div className="permissions-table-card">
            {error && (
              <div className="message-alert error">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px' }}>
                Click on a permission to see which roles have it assigned
              </p>

              {permissions.length > 0 ? (
                permissions.map((permission) => (
                  <div key={permission.id} className="permission-item">
                    <div
                      className="permission-header"
                      onClick={() => setExpandedPermission(
                        expandedPermission === permission.id ? null : permission.id
                      )}
                    >
                      <div className="permission-info">
                        <div className="permission-name">{permission.name}</div>
                        <div className="permission-meta">
                          <span className="permission-badge resource-badge">
                            {permission.resource}
                          </span>
                          <span className="permission-badge action-badge">
                            {permission.action}
                          </span>
                        </div>
                        {permission.description && (
                          <div className="permission-description">
                            {permission.description}
                          </div>
                        )}
                      </div>
                      <div className={`permission-expand-icon ${expandedPermission === permission.id ? 'expanded' : ''}`}>
                        <ChevronDown size={20} />
                      </div>
                    </div>

                    {expandedPermission === permission.id && (
                      <div className="permission-details">
                        <h4>
                          Roles with this permission ({permission.roles?.length || 0})
                        </h4>
                        {permission.roles && permission.roles.length > 0 ? (
                          <div className="roles-grid">
                            {permission.roles.map(role => (
                              <div key={role.id} className="role-card">
                                <div className="role-name">{role.name}</div>
                                <div className="role-level">
                                  Level: {role.hierarchy_level}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="no-roles">
                            No roles have this permission assigned
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Shield size={48} className="empty-state-icon" />
                  <div className="empty-state-title">No permissions found</div>
                  <div className="empty-state-description">
                    {resourceFilter
                      ? 'Try adjusting your filter to see more results.'
                      : 'No permissions are available in the system.'}
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <div className="pagination-info">
                  Showing {permissions.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} permissions
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <div className="pagination-current">
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

// ─── Sub-components ───

function StatCard({ label, value, icon, color, description }: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
  description?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
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
