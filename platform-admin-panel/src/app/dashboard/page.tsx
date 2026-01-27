'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Shield, Lock, MapPin } from 'lucide-react'

const stats = [
  { label: 'Total Admins', value: '127', icon: Users, color: 'bg-blue-100 text-blue-600' },
  { label: 'Active Roles', value: '6', icon: Shield, color: 'bg-green-100 text-green-600' },
  { label: 'Permissions', value: '12', icon: Lock, color: 'bg-purple-100 text-purple-600' },
  { label: 'Regions', value: '24', icon: MapPin, color: 'bg-orange-100 text-orange-600' },
]

const chartData = [
  { name: 'Super Admin', value: 1 },
  { name: 'Province Admin', value: 7 },
  { name: 'District Admin', value: 9 },
  { name: 'Palika Admin', value: 45 },
  { name: 'Moderator', value: 28 },
  { name: 'Support', value: 37 },
]

export default function DashboardPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{stat.label}</p>
                      <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
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
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '2 hours ago', action: 'Created admin', user: 'Raj Poudel' },
                { time: '5 hours ago', action: 'Updated role', user: 'Hari Sharma' },
                { time: '1 day ago', action: 'Assigned region', user: 'Priya Thapa' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-center justify-between py-3 border-b border-slate-200 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.user}</p>
                  </div>
                  <p className="text-xs text-slate-500">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
