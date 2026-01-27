'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'

interface Permission {
  id: number
  name: string
  resource: string
  action: string
  description: string
}

interface Role {
  id: number
  name: string
  hierarchy_level: string
}

interface PermissionWithRoles extends Permission {
  roles: Role[]
}

interface ApiResponse {
  data: Permission[]
  total: number
  page: number
  limit: number
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

      // Fetch permissions
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', limit.toString())
      if (resourceFilter) params.append('resource', resourceFilter)

      const permResponse = await fetch(`/api/permissions?${params.toString()}`)

      if (!permResponse.ok) {
        if (permResponse.status === 401) {
          setError('Unauthorized: Please log in')
        } else if (permResponse.status === 403) {
          setError('Forbidden: You do not have permission to view permissions')
        } else {
          setError('Failed to fetch permissions')
        }
        setPermissions([])
        return
      }

      const permData: ApiResponse = await permResponse.json()

      // Fetch all roles
      const rolesResponse = await fetch('/api/roles?limit=1000')
      if (!rolesResponse.ok) {
        throw new Error('Failed to fetch roles')
      }
      const rolesData = await rolesResponse.json()
      setAllRoles(rolesData.data || [])

      // Fetch roles for each permission
      const permissionsWithRoles = await Promise.all(
        (permData.data || []).map(async (perm) => {
          const { data: rolePerms, error: rolePermError } = await fetch(
            `/api/roles?limit=1000`
          ).then(r => r.json())

          // Find which roles have this permission
          const rolesWithPerm: Role[] = []
          for (const role of rolesData.data || []) {
            const { data: perms } = await fetch(
              `/api/roles/${role.id}/permissions`
            ).then(r => r.json())

            if (perms?.some((p: Permission) => p.id === perm.id)) {
              rolesWithPerm.push(role)
            }
          }

          return {
            ...perm,
            roles: rolesWithPerm
          }
        })
      )

      setPermissions(permissionsWithRoles)
      setTotalCount(permData.total || 0)
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
        <div style={{ padding: '20px' }}>Loading permissions...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1>Permissions Management</h1>

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
        <div style={{ marginBottom: '20px' }}>
          <div className="form-group">
            <label htmlFor="resource-filter">Filter by Resource</label>
            <select
              id="resource-filter"
              value={resourceFilter}
              onChange={(e) => handleResourceFilter(e.target.value)}
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

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Click on a permission to see which roles have it assigned
          </p>

          {permissions.map((permission) => (
            <div
              key={permission.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '10px',
                overflow: 'hidden'
              }}
            >
              <div
                onClick={() => setExpandedPermission(
                  expandedPermission === permission.id ? null : permission.id
                )}
                style={{
                  padding: '15px',
                  backgroundColor: '#f8f9fa',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  userSelect: 'none'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                    {permission.name}
                  </div>
                  <div style={{ fontSize: '0.9em', color: '#666' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: '#e7f3ff',
                      color: '#004085',
                      borderRadius: '3px',
                      marginRight: '10px'
                    }}>
                      {permission.resource}
                    </span>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: '#e2e3e5',
                      color: '#383d41',
                      borderRadius: '3px'
                    }}>
                      {permission.action}
                    </span>
                  </div>
                  {permission.description && (
                    <div style={{ fontSize: '0.85em', color: '#999', marginTop: '5px' }}>
                      {permission.description}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '1.2em', color: '#666' }}>
                  {expandedPermission === permission.id ? '▼' : '▶'}
                </div>
              </div>

              {expandedPermission === permission.id && (
                <div style={{ padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #ddd' }}>
                  <h4 style={{ marginTop: 0, marginBottom: '10px' }}>
                    Roles with this permission ({permission.roles?.length || 0})
                  </h4>
                  {permission.roles && permission.roles.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                      {permission.roles.map(role => (
                        <div
                          key={role.id}
                          style={{
                            padding: '10px',
                            backgroundColor: '#d4edda',
                            border: '1px solid #c3e6cb',
                            borderRadius: '4px',
                            color: '#155724'
                          }}
                        >
                          <div style={{ fontWeight: 'bold' }}>{role.name}</div>
                          <div style={{ fontSize: '0.9em' }}>
                            Level: {role.hierarchy_level}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: '#666', fontStyle: 'italic' }}>
                      No roles have this permission assigned
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {permissions.length === 0 && !isLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              {resourceFilter
                ? 'No permissions found for this resource.'
                : 'No permissions found.'}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
            <div style={{ color: '#666', fontSize: '0.9em' }}>
              Showing {permissions.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} permissions
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
    </AdminLayout>
  )
}
