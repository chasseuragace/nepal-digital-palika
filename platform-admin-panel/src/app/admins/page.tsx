'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Plus, Edit2, Trash2 } from 'lucide-react'

const admins = [
  {
    id: '1',
    name: 'Raj Poudel',
    email: 'raj@nepaltourism.dev',
    role: 'super_admin',
    region: 'National',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Hari Sharma',
    email: 'hari@nepaltourism.dev',
    role: 'province_admin',
    region: 'Bagmati Province',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Priya Thapa',
    email: 'priya@nepaltourism.dev',
    role: 'district_admin',
    region: 'Kathmandu District',
    status: 'Active',
  },
  {
    id: '4',
    name: 'Sunita Gurung',
    email: 'sunita@nepaltourism.dev',
    role: 'palika_admin',
    region: 'Kathmandu Metropolitan',
    status: 'Active',
  },
]

export default function AdminsPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admins</h1>
            <p className="text-slate-600 mt-1">Manage platform administrators and their roles</p>
          </div>
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Admin
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search admins..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Roles</option>
            <option>Super Admin</option>
            <option>Province Admin</option>
            <option>District Admin</option>
            <option>Palika Admin</option>
          </select>
          <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
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
                  <TableHeader>Region</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {admin.role.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>{admin.region}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {admin.status}
                      </span>
                    </TableCell>
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
