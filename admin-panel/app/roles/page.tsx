'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { rolesService, type Role } from '@/lib/client/roles-client.service'
import type { Permission } from '@/lib/client/permissions-client.service'

interface ApiResponse {
  data: Role[]
  total: number
  page: number
  limit: number
}

interface DeleteConfirmationState {
  isOpen: boolean
  roleId: number | null
  roleName: string | null
  isDeleting: boolean
  error: string | null
}

interface CreateFormState {
  isOpen: boolean
  name: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  description: string
  description_ne: string
  isSubmitting: boolean
  error: string | null
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [hierarchyLevelFilter, setHierarchyLevelFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [limit] = useState(10)
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmationState>({
    isOpen: false,
    roleId: null,
    roleName: null,
    isDeleting: false,
    error: null
  })
  const [createForm, setCreateForm] = useState<CreateFormState>({
    isOpen: false,
    name: '',
    hierarchy_level: 'palika',
    description: '',
    description_ne: '',
    isSubmitting: false,
    error: null
  })

  useEffect(() => {
    fetchRoles()
  }, [search, hierarchyLevelFilter, currentPage])

  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const data = await rolesService.getAll({
        page: currentPage,
        limit
      })
      setRoles(data.data || [])
      setTotalCount(data.total || 0)
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError('Error fetching roles')
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const handleHierarchyLevelFilter = (value: string) => {
    setHierarchyLevelFilter(value)
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(totalCount / limit)

  const openDeleteConfirmation = (role: Role) => {
    setDeleteConfirmation({
      isOpen: true,
      roleId: role.id,
      roleName: role.name,
      isDeleting: false,
      error: null
    })
  }

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      roleId: null,
      roleName: null,
      isDeleting: false,
      error: null
    })
  }

  const handleDeleteRole = async () => {
    if (!deleteConfirmation.roleId) return

    try {
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: true, error: null }))

      await rolesService.delete(deleteConfirmation.roleId)

      await fetchRoles()
      closeDeleteConfirmation()
    } catch (err) {
      console.error('Error deleting role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role'
      setDeleteConfirmation(prev => ({ ...prev, error: errorMessage, isDeleting: false }))
    }
  }

  const openCreateForm = () => {
    setCreateForm({
      isOpen: true,
      name: '',
      hierarchy_level: 'palika',
      description: '',
      description_ne: '',
      isSubmitting: false,
      error: null
    })
  }

  const closeCreateForm = () => {
    setCreateForm({
      isOpen: false,
      name: '',
      hierarchy_level: 'palika',
      description: '',
      description_ne: '',
      isSubmitting: false,
      error: null
    })
  }

  const handleCreateRole = async () => {
    if (!createForm.name || !createForm.hierarchy_level) {
      setCreateForm(prev => ({ ...prev, error: 'Name and hierarchy level are required' }))
      return
    }

    try {
      setCreateForm(prev => ({ ...prev, isSubmitting: true, error: null }))

      await rolesService.create({
        name: createForm.name,
        hierarchy_level: createForm.hierarchy_level,
        description: createForm.description,
        description_ne: createForm.description_ne
      })

      await fetchRoles()
      closeCreateForm()
    } catch (err) {
      console.error('Error creating role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role'
      setCreateForm(prev => ({ ...prev, error: errorMessage, isSubmitting: false }))
    }
  }

  if (isLoading && roles.length === 0) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Loading roles...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Roles Management</h1>
        <button onClick={openCreateForm} className="btn btn-primary">
          Add New Role
        </button>
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
              placeholder="Search roles..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
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
              <th>Hierarchy Level</th>
              <th>Description</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td>{role.name}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e7f3ff',
                    color: '#004085',
                    fontSize: '0.9em'
                  }}>
                    {role.hierarchy_level}
                  </span>
                </td>
                <td>{role.description || '-'}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e2e3e5',
                    color: '#383d41',
                    fontSize: '0.9em'
                  }}>
                    {role.permissions?.length || 0} permissions
                  </span>
                </td>
                <td>
                  <Link href={`/roles/${role.id}`} className="btn btn-secondary" style={{ marginRight: '5px' }}>
                    Edit
                  </Link>
                  <button
                    onClick={() => openDeleteConfirmation(role)}
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

        {roles.length === 0 && !isLoading && (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {search || hierarchyLevelFilter
              ? 'No roles match your filters.'
              : 'No roles found.'}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
            <div style={{ color: '#666', fontSize: '0.9em' }}>
              Showing {roles.length > 0 ? (currentPage - 1) * limit + 1 : 0} to {Math.min(currentPage * limit, totalCount)} of {totalCount} roles
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
              Delete Role
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Are you sure you want to delete <strong>{deleteConfirmation.roleName}</strong>? This action cannot be undone.
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
                onClick={handleDeleteRole}
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

      {/* Create Role Dialog */}
      {createForm.isOpen && (
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
            maxWidth: '500px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
              Create New Role
            </h2>

            {createForm.error && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                border: '1px solid #f5c6cb'
              }}>
                {createForm.error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="role-name">Role Name *</label>
              <input
                id="role-name"
                type="text"
                placeholder="Enter role name"
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="hierarchy-level">Hierarchy Level *</label>
              <select
                id="hierarchy-level"
                value={createForm.hierarchy_level}
                onChange={(e) => setCreateForm(prev => ({ ...prev, hierarchy_level: e.target.value as any }))}
              >
                <option value="national">National</option>
                <option value="province">Province</option>
                <option value="district">District</option>
                <option value="palika">Palika</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Enter role description"
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '15px' }}>
              <label htmlFor="description-ne">Description (Nepali)</label>
              <textarea
                id="description-ne"
                placeholder="Enter role description in Nepali"
                value={createForm.description_ne}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description_ne: e.target.value }))}
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={closeCreateForm}
                disabled={createForm.isSubmitting}
                className="btn btn-secondary"
                style={{ opacity: createForm.isSubmitting ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={createForm.isSubmitting}
                className="btn btn-primary"
                style={{
                  opacity: createForm.isSubmitting ? 0.5 : 1,
                  cursor: createForm.isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {createForm.isSubmitting ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
