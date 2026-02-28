'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useAdmin } from '@/lib/hooks'
import { apiClient } from '@/lib/api-client'

interface FormData {
  full_name: string
  is_active: boolean
}

export default function EditAdminPage() {
  const params = useParams()
  const router = useRouter()
  const adminId = params.id as string

  const { data: admin, isLoading, error: adminError } = useAdmin(adminId)

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    is_active: true
  })

  useEffect(() => {
    if (admin) {
      setFormData({
        full_name: admin.full_name,
        is_active: admin.is_active
      })
    }
  }, [admin])

  const handleSave = async () => {
    if (!formData.full_name) {
      setError('Full name is required')
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccess(false)

      await apiClient.updateAdmin(adminId, {
        full_name: formData.full_name,
        is_active: formData.is_active
      })

      setSuccess(true)
      setTimeout(() => router.push('/admins'), 2000)
    } catch (err) {
      console.error('Error saving admin:', err)
      setError(err instanceof Error ? err.message : 'Failed to save admin')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="text-slate-600">Loading admin data...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!admin || adminError) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{adminError?.message || 'Admin not found'}</p>
          </div>
          <Link href="/admins">
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admins
            </Button>
          </Link>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <Link href="/admins">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admins
          </Button>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-slate-900">Edit Admin: {admin?.full_name}</h1>
          <p className="text-slate-600 mt-1">Update admin details and settings</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">Admin updated successfully! Redirecting...</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-900">Admin Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email (Read-only)
              </label>
              <input
                type="email"
                value={admin?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Role (Read-only)
              </label>
              <input
                type="text"
                value={admin?.role || ''}
                disabled
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-600 cursor-not-allowed"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                Active
              </label>
            </div>

            <div className="pt-2 text-sm text-slate-600">
              <p>Created: {admin?.created_at ? new Date(admin.created_at).toLocaleDateString() : '-'}</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Link href="/admins">
            <Button variant="secondary">Cancel</Button>
          </Link>
        </div>
      </div>
    </AdminLayout>
  )
}
