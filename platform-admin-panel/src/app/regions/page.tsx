'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Edit2 } from 'lucide-react'

const regions = [
  { id: '1', name: 'Koshi Province', type: 'Province', districts: 2, palikas: 2, admins: 1 },
  { id: '2', name: 'Madhesh Province', type: 'Province', districts: 1, palikas: 1, admins: 1 },
  { id: '3', name: 'Bagmati Province', type: 'Province', districts: 3, palikas: 3, admins: 2 },
  { id: '4', name: 'Gandaki Province', type: 'Province', districts: 2, palikas: 2, admins: 1 },
  { id: '5', name: 'Lumbini Province', type: 'Province', districts: 1, palikas: 0, admins: 0 },
  { id: '6', name: 'Karnali Province', type: 'Province', districts: 0, palikas: 0, admins: 0 },
  { id: '7', name: 'Sudurpashchim Province', type: 'Province', districts: 0, palikas: 0, admins: 0 },
]

export default function RegionsPage() {
  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Regions</h1>
          <p className="text-slate-600 mt-1">Manage geographic hierarchy and admin assignments</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
            Provinces
          </button>
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900">
            Districts
          </button>
          <button className="px-4 py-2 text-slate-600 hover:text-slate-900">
            Palikas
          </button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Districts</TableHeader>
                  <TableHeader>Palikas</TableHeader>
                  <TableHeader>Admins</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {regions.map((region) => (
                  <TableRow key={region.id}>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        {region.type}
                      </span>
                    </TableCell>
                    <TableCell>{region.districts}</TableCell>
                    <TableCell>{region.palikas}</TableCell>
                    <TableCell>{region.admins}</TableCell>
                    <TableCell>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4 text-slate-600" />
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
