'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Plus, Edit2, Trash2 } from 'lucide-react'

const roles = [
  { id: '1', name: 'super_admin', level: 'National', admins: 1, permissions: 12 },
  { id: '2', name: 'province_admin', level: 'Province', admins: 7, permissions: 10 },
  { id: '3', name: 'district_admin', level: 'District', admins: 9, permissions: 8 },
  { id: '4', name: 'palika_admin', level: 'Palika', admins: 45, permissions: 8 },
  { id: '5', name: 'moderator', level: 'Palika', admins: 28, permissions: 3 },
  { id: '6', name: 'support_agent', level: 'Palika', admins: 37, permissions: 2 },
]

export default function RolesPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Roles</h1>
            <p className="text-slate-600 mt-1">Manage roles and their permissions</p>
          </div>
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Role
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Role Name</TableHeader>
                  <TableHeader>Level</TableHeader>
                  <TableHeader>Admins</TableHeader>
                  <TableHeader>Permissions</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                        {role.level}
                      </span>
                    </TableCell>
                    <TableCell>{role.admins}</TableCell>
                    <TableCell>{role.permissions}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
