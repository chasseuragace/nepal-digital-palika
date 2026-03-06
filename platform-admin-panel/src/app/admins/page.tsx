'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Plus, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { useAdmins, useRolePermissions } from '@/lib/hooks'
import { useState } from 'react'
import Link from 'next/link'
import { Admin } from '@/lib/api-client'

// Helper component to display permissions for an admin
function AdminPermissionsCell({ admin }: { admin: Admin }) {
  const rolePermissionMap: Record<string, string[]> = {
    super_admin: ['All Permissions', 'National Scope'],
    province_admin: ['Manage Province', 'View Districts', 'Manage Staff'],
    district_admin: ['Manage District', 'View Palikas', 'Manage Staff'],
    palika_admin: ['Manage Palika', 'Manage Content', 'Manage Staff'],
    moderator: ['Moderate Content', 'View Analytics'],
  }

  const permissions = rolePermissionMap[admin.role] || ['View Only']

  return (
    <div className="space-y-1">
      {permissions.slice(0, 2).map((perm, idx) => (
        <span key={idx} className="inline-block bg-purple-100 text-purple-700 rounded-full text-xs px-2 py-1 mr-1">
          {perm}
        </span>
      ))}
      {permissions.length > 2 && (
        <span className="inline-block bg-slate-100 text-slate-600 rounded-full text-xs px-2 py-1">
          +{permissions.length - 2} more
        </span>
      )}
    </div>
  )
}

export default function AdminsPage() {
  const { data: admins, isLoading, error } = useAdmins()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [expandedAdmins, setExpandedAdmins] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filteredAdmins = admins?.filter((admin) => {
    const matchesSearch = admin.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    return matchesSearch && matchesRole
  }) || []

  const handleDeleteClick = (admin: Admin) => {
    setDeleteDialog({ id: admin.id, name: admin.full_name })
  }

  const handleConfirmDelete = async () => {
    if (!deleteDialog) return

    try {
      setIsDeleting(true)
      const response = await fetch(`/api/admins/${deleteDialog.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        alert(`Error: ${data.error || 'Failed to delete admin'}`)
        return
      }

      // Refetch admins list
      window.location.reload()
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to delete admin'}`)
    } finally {
      setIsDeleting(false)
      setDeleteDialog(null)
    }
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading admins: {error.message}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admins</h1>
            <p className="text-slate-600 mt-1">Manage platform administrators and their roles</p>
          </div>
          <Link href="/admins/new">
            <Button variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Admin
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="province_admin">Province Admin</option>
            <option value="district_admin">District Admin</option>
            <option value="palika_admin">Palika Admin</option>
          </select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Email</TableHeader>
                  <TableHeader>Role</TableHeader>
                  <TableHeader>Permissions</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      Loading admins...
                    </TableCell>
                  </TableRow>
                ) : filteredAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.full_name}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {admin.email || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          {admin.role.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <AdminPermissionsCell admin={admin} />
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {admin.palikas ? (
                          <div className="space-y-0.5">
                            <div className="font-medium text-slate-900">{admin.palikas.name_en}</div>
                            <div className="text-xs text-slate-500">
                              {admin.palikas.districts?.name_en}
                              {admin.palikas.districts?.provinces && (
                                <>, {admin.palikas.districts.provinces.name_en}</>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/admins/${admin.id}`}>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4 text-slate-600" />
                            </button>
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(admin)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        {deleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <h2 className="text-xl font-semibold text-slate-900">Delete Admin</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-700">
                  Are you sure you want to delete <strong>{deleteDialog.name}</strong>?
                </p>
                <p className="text-sm text-slate-600">
                  This action will permanently remove the admin account. This cannot be undone.
                </p>
                <div className="flex gap-3 justify-end pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setDeleteDialog(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
