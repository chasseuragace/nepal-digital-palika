'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useRoles } from '@/lib/hooks'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function RolesPage() {
  const { data: roles, isLoading, error } = useRoles()
  const [roleStats, setRoleStats] = useState<Record<number, { admins: number; permissions: number }>>({})

  useEffect(() => {
    if (roles) {
      // Calculate stats for each role
      const stats: Record<number, { admins: number; permissions: number }> = {}
      roles.forEach((role) => {
        stats[role.id] = { admins: 0, permissions: 0 }
      })
      setRoleStats(stats)
    }
  }, [roles])

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading roles: {error.message}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const getRoleLevel = (roleName: string) => {
    if (roleName.includes('super')) return 'National'
    if (roleName.includes('province')) return 'Province'
    if (roleName.includes('district')) return 'District'
    if (roleName.includes('palika')) return 'Palika'
    return 'Other'
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Roles</h1>
            <p className="text-slate-600 mt-1">Manage roles and their permissions</p>
          </div>
          <Link href="/roles/new" className="inline-block">
            <Button variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              New Role
            </Button>
          </Link>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Role Name</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      Loading roles...
                    </TableCell>
                  </TableRow>
                ) : roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                          {getRoleLevel(role.name)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(role.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/roles/${role.id}`}>
                            <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
                              <Edit2 className="w-4 h-4 text-slate-600" />
                            </button>
                          </Link>
                          <button className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No roles found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
