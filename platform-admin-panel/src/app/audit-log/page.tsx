'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Eye } from 'lucide-react'

const auditLogs = [
  {
    id: '1',
    timestamp: '2026-01-26 14:30',
    admin: 'Raj Poudel',
    action: 'Created',
    entity: 'Admin: Hari Sharma',
  },
  {
    id: '2',
    timestamp: '2026-01-26 14:25',
    admin: 'Raj Poudel',
    action: 'Updated',
    entity: 'Role: province_admin',
  },
  {
    id: '3',
    timestamp: '2026-01-26 14:20',
    admin: 'Hari Sharma',
    action: 'Created',
    entity: 'Heritage Site: Pashupatinath',
  },
  {
    id: '4',
    timestamp: '2026-01-26 14:15',
    admin: 'Sunita Gurung',
    action: 'Approved',
    entity: 'Event: Dashain Festival',
  },
  {
    id: '5',
    timestamp: '2026-01-26 14:10',
    admin: 'Raj Poudel',
    action: 'Deleted',
    entity: 'Admin: Old User',
  },
]

export default function AuditLogPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-600 mt-1">Track all system activities and changes</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search audit logs..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Actions</option>
            <option>Created</option>
            <option>Updated</option>
            <option>Deleted</option>
            <option>Approved</option>
          </select>
          <input
            type="date"
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Timestamp</TableHeader>
                  <TableHeader>Admin</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Entity</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{log.timestamp}</TableCell>
                    <TableCell className="font-medium">{log.admin}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>{log.entity}</TableCell>
                    <TableCell>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
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
