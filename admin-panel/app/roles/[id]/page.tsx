'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import Link from 'next/link'
import { rolesService, type Role } from '@/lib/client/roles-client.service'
import { permissionsService, type Permission } from '@/lib/client/permissions-client.service'

type AllPermissions = Permission

export default function RoleEditPage() {
  const params = useParams()
  const router = useRouter()
  const roleId = parseInt(params.id as string)

  const [role, setRole] = useState<Role | null>(null)
  const [allPermissions, setAllPermissions] = useState<AllPermissions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    hierarchy_level: 'palika' as const,
    description: '',
    description_ne: '',
    selectedPermissions: new Set<number>()
  })

  useEffect(() => {
    fetchRoleAndPermissions()
  }, [roleId])

  const fetchRoleAndPermissions = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch role details and all permissions in parallel
      const [roleData, permData] = await Promise.all([
        rolesService.getById(roleId),
        permissionsService.getAll()
      ])

      setRole(roleData)
      setAllPermissions(permData.data || [])

      // Set form data
      setFormData({
        name: roleData.name,
        hierarchy_level: roleData.hierarchy_level as any,
        description: roleData.description,
        description_ne: roleData.description_ne,
        selectedPermissions: new Set(roleData.permissions?.map((p: Permission) => p.id) || [])
      })
    } catch (err) {
      console.error('Error fetching role:', err)
      setError('Failed to load role details')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePermissionToggle = (permissionId: number) => {
    const newSelected = new Set(formData.selectedPermissions)
    if (newSelected.has(permissionId)) {
      newSelected.delete(permissionId)
    } else {
      newSelected.add(permissionId)
    }
    setFormData(prev => ({ ...prev, selectedPermissions: newSelected }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.hierarchy_level) {
      setSaveError('Name and hierarchy level are required')
      return
    }

    try {
      setIsSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      // Update role
      await rolesService.update(roleId, {
        name: formData.name,
        hierarchy_level: formData.hierarchy_level,
        description: formData.description,
        description_ne: formData.description_ne
      })

      // Update permissions
      await rolesService.assignPermissions(roleId, Array.from(formData.selectedPermissions))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving role:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save role'
      setSaveError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Loading role details...</div>
      </AdminLayout>
    )
  }

  if (!role) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            {error || 'Role not found'}
          </div>
          <Link href="/roles" className="btn btn-secondary" style={{ marginTop: '20px' }}>
            Back to Roles
          </Link>
        </div>
      </AdminLayout>
    )
  }

  // Group permissions by resource
  const permissionsByResource = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {} as Record<string, AllPermissions[]>)

  return (
    <AdminLayout>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/roles" className="btn btn-secondary">
          ← Back to Roles
        </Link>
      </div>

      <h1>Edit Role: {role.name}</h1>

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

      {saveError && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          Role updated successfully!
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <h2>Role Details</h2>

        <div className="form-group">
          <label htmlFor="name">Role Name *</label>
          <input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="hierarchy-level">Hierarchy Level *</label>
          <select
            id="hierarchy-level"
            value={formData.hierarchy_level}
            onChange={(e) => setFormData(prev => ({ ...prev, hierarchy_level: e.target.value as any }))}
          >
            <option value="national">National</option>
            <option value="province">Province</option>
            <option value="district">District</option>
            <option value="palika">Palika</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description-ne">Description (Nepali)</label>
          <textarea
            id="description-ne"
            value={formData.description_ne}
            onChange={(e) => setFormData(prev => ({ ...prev, description_ne: e.target.value }))}
            rows={3}
          />
        </div>
      </div>

      <div className="card">
        <h2>Permissions</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Select permissions to assign to this role
        </p>

        {Object.entries(permissionsByResource).map(([resource, permissions]) => (
          <div key={resource} style={{ marginBottom: '20px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#333' }}>
              {resource.replace(/_/g, ' ').toUpperCase()}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
              {permissions.map(perm => (
                <label key={perm.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: formData.selectedPermissions.has(perm.id) ? '#e7f3ff' : 'white'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.selectedPermissions.has(perm.id)}
                    onChange={() => handlePermissionToggle(perm.id)}
                    style={{ marginRight: '10px', marginTop: '2px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{perm.name}</div>
                    <div style={{ fontSize: '0.9em', color: '#666' }}>{perm.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary"
          style={{
            opacity: isSaving ? 0.5 : 1,
            cursor: isSaving ? 'not-allowed' : 'pointer'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
        <Link href="/roles" className="btn btn-secondary">
          Cancel
        </Link>
      </div>
    </AdminLayout>
  )
}
