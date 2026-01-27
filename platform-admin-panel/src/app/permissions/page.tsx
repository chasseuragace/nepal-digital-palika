'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Plus, Edit2, Trash2 } from 'lucide-react'

const permissions = [
  { id: '1', name: 'manage_heritage_sites', resource: 'heritage_site', action: 'manage', roles: 4 },
  { id: '2', name: 'manage_events', resource: 'event', action: 'manage', roles: 4 },
  { id: '3', name: 'manage_businesses', resource: 'business', action: 'manage', roles: 3 },
  { id: '4', name: 'manage_blog_posts', resource: 'blog_post', action: 'manage', roles: 3 },
  { id: '5', name: 'manage_users', resource: 'user', action: 'manage', roles: 2 },
  { id: '6', name: 'manage_admins', resource: 'admin', action: 'manage', roles: 1 },
  { id: '7', name: 'manage_sos', resource: 'sos_request', action: 'manage', roles: 3 },
  { id: '8', name: 'manage_support', resource: 'support_ticket', action: 'manage', roles: 2 },
  { id: '9', name: 'moderate_content', resource: 'content', action: 'moderate', roles: 4 },
  { id: '10', name: 'view_analytics', resource: 'analytics', action: 'view', roles: 5 },
  { id: '11', name: 'manage_categories', resource: 'category', action: 'manage', roles: 1 },
  { id: '12', name: 'send_notifications', resource: 'notification', action: 'send', roles: 2 },
]

export default function PermissionsPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Permissions</h1>
            <p className="text-slate-600 mt-1">Manage system permissions</p>
          </div>
          <Button variant="primary" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            New Permission
          </Button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Permission Name</TableHeader>
                  <TableHeader>Resource</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Roles</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        {permission.resource}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {permission.action}
                      </span>
                    </TableCell>
                    <TableCell>{permission.roles}</TableCell>
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
