'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useRole, usePermissions } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'

interface Permission {
  id: number
  name: string
  description?: string
}

interface Role {
  id: number
  name: string
  description?: string
  created_at: string
}

export default function EditRolePage() {
  const params = useParams()
  const router = useRouter()
  const roleId = parseInt(params.id as string)

  const { data: role, isLoading: roleLoading, error: roleError } = useRole(roleId)
  const { data: allPermissions, isLoading: permLoading } = usePermissions()

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedPermissions: new Set<number>()
  })

  useEffect(() => {
    if (role) {
      setFormData(prev => ({
        ...prev,
        name: role.name,
        description: role.description || ''
      }))
    }
  }, [role])

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
    if (!formData.name) {
      setError('Name is required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccess(false)

      await apiClient.updateRole(roleId, {
        name: formData.name,
        description: formData.description
      })

      setSuccess(true)
      setTimeout(() => router.push('/roles'), 2000)
    } catch (err) {
      console.error('Error saving role:', err)
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setIsSaving(false)
    }
  }

  if (roleLoading || permLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-slate-600">Loading role details...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!role || roleError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{roleError?.message || 'Role not found'}</p>
          </div>
          <Link href="/roles">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Roles
            </Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const permissionsByResource = (allPermissions || []).reduce((acc, perm) => {
    const resource = perm.name?.split('_')[0] || 'other'
    if (!acc[resource]) {
      acc[resource] = []
    }
    acc[resource].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <Link href="/roles">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Roles
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Role: {role?.name}</h1>
          <p className="text-slate-600 mt-1">Update role details and permissions</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">Role updated successfully! Redirecting...</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Role Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Hierarchy Level *
              </label>
              <select
                value={formData.hierarchy_level}
                onChange={(e) => setFormData(prev => ({ ...prev, hierarchy_level: e.target.value as any }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="national">National</option>
                <option value="province">Province</option>
                <option value="district">District</option>
                <option value="palika">Palika</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Permissions</h2>
            <p className="text-sm text-slate-600 mt-1">Select permissions to assign to this role</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(permissionsByResource).map(([resource, permissions]) => (
              <div key={resource}>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase">
                  {resource.replace(/_/g, ' ')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permissions.map(perm => (
                    <label
                      key={perm.id}
                      className="flex items-start p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedPermissions.has(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="font-medium text-slate-900">{perm.name}</div>
                        <div className="text-sm text-slate-600">{perm.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/roles">
            <Button variant="secondary">Cancel</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
