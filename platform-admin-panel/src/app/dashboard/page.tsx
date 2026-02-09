'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Shield, Lock, MapPin } from 'lucide-react'
import { useDashboardStats, useAuditLog } from '@/lib/hooks'

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats()
  const { data: auditLogs, isLoading: logsLoading } = useAuditLog(3)

  const statCards = [
    { label: 'Total Admins', value: stats?.total_admins || 0, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Roles', value: stats?.active_roles || 0, icon: Shield, color: 'bg-green-100 text-green-600' },
    { label: 'Permissions', value: stats?.permissions || 0, icon: Lock, color: 'bg-purple-100 text-purple-600' },
    { label: 'Regions', value: stats?.regions || 0, icon: MapPin, color: 'bg-orange-100 text-orange-600' },
  ]

  const chartData = stats?.admins_by_role?.map((item: any) => ({
    name: item.role.replace(/_/g, ' '),
    value: item.count,
  })) || []

  if (statsError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading dashboard: {statsError.message}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">
                        {statsLoading ? '...' : stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Admins by Role</h3>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="h-80 flex items-center justify-center text-slate-500">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logsLoading ? (
                <p className="text-slate-500">Loading activity...</p>
              ) : auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.action}</p>
                      <p className="text-xs text-slate-500">{log.entity_type}</p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
