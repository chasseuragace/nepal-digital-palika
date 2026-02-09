'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Eye } from 'lucide-react'
import { useAuditLog } from '@/lib/hooks'
import { useState } from 'react'

export default function AuditLogPage() {
  const { data: auditLogs, isLoading, error } = useAuditLog()
  const [actionFilter, setActionFilter] = useState('all')

  const filteredLogs = auditLogs?.filter((log) => {
    if (actionFilter === 'all') return true
    return log.action.toLowerCase() === actionFilter.toLowerCase()
  }) || []

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading audit logs: {error.message}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const getActionColor = (action: string) => {
    const lower = action.toLowerCase()
    if (lower.includes('create')) return 'bg-green-100 text-green-700'
    if (lower.includes('update')) return 'bg-blue-100 text-blue-700'
    if (lower.includes('delete')) return 'bg-red-100 text-red-700'
    if (lower.includes('approve')) return 'bg-purple-100 text-purple-700'
    return 'bg-slate-100 text-slate-700'
  }

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
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="approve">Approved</option>
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
                  <TableHeader>Admin ID</TableHeader>
                  <TableHeader>Action</TableHeader>
                  <TableHeader>Entity Type</TableHeader>
                  <TableHeader>Entity ID</TableHeader>
                  <TableHeader>Details</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-slate-600">
                        {log.admin_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{log.entity_type}</TableCell>
                      <TableCell className="text-sm font-mono text-slate-600">
                        {log.entity_id ? log.entity_id.substring(0, 8) : '-'}
                      </TableCell>
                      <TableCell>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-slate-600" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                      No audit logs found
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
