'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table'
import { Edit2 } from 'lucide-react'
import { useProvinces, useDistricts, usePalikas } from '@/lib/hooks'
import { useState } from 'react'

type RegionType = 'provinces' | 'districts' | 'palikas'

export default function RegionsPage() {
  const [activeTab, setActiveTab] = useState<RegionType>('provinces')
  const { data: provinces, isLoading: provincesLoading, error: provincesError } = useProvinces()
  const { data: districts, isLoading: districtsLoading, error: districtsError } = useDistricts()
  const { data: palikas, isLoading: palikasLoading, error: palikasError } = usePalikas()

  const getActiveData = () => {
    switch (activeTab) {
      case 'provinces':
        return { data: provinces, isLoading: provincesLoading, error: provincesError }
      case 'districts':
        return { data: districts, isLoading: districtsLoading, error: districtsError }
      case 'palikas':
        return { data: palikas, isLoading: palikasLoading, error: palikasError }
    }
  }

  const { data, isLoading, error } = getActiveData()

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error loading regions: {error.message}</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

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
          <button
            onClick={() => setActiveTab('provinces')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'provinces'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Provinces ({provinces?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('districts')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'districts'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Districts ({districts?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('palikas')}
            className={`px-4 py-2 border-b-2 font-medium transition-colors ${
              activeTab === 'palikas'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Palikas ({palikas?.length || 0})
          </button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeader>Name (English)</TableHeader>
                  <TableHeader>Name (Nepali)</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      Loading {activeTab}...
                    </TableCell>
                  </TableRow>
                ) : data && data.length > 0 ? (
                  data.map((region) => (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name_en}</TableCell>
                      <TableCell className="text-slate-600">{region.name_ne || '-'}</TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {new Date(region.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-slate-600" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                      No {activeTab} found
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
