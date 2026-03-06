'use client'

import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useProvinces, useDistricts, usePalikas } from '@/lib/hooks'

interface FormData {
  email: string
  password: string
  confirm_password: string
  full_name: string
  role: 'province_admin' | 'district_admin' | 'palika_admin'
  province_id: number | null
  district_id: number | null
  palika_id: number | null
}

// Support all admin hierarchy levels per subscription scope
// - Province Admin: manages entire province + all palikas in it
// - District Admin: manages entire district + all palikas in it
// - Palika Admin: manages single palika
const ROLE_OPTIONS = [
  { value: 'province_admin', label: 'Province Admin', hierarchyLevel: 'province', requiresRegion: 'province' },
  { value: 'district_admin', label: 'District Admin', hierarchyLevel: 'district', requiresRegion: 'district' },
  { value: 'palika_admin', label: 'Palika Admin', hierarchyLevel: 'palika', requiresRegion: 'palika' },
] as const

export default function CreateAdminPage() {
  const router = useRouter()
  const { data: provinces = [] } = useProvinces()
  const { data: districts = [] } = useDistricts()
  const { data: palikas = [] } = usePalikas()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    role: 'palika_admin',
    province_id: null,
    district_id: null,
    palika_id: null,
  })

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleInputChange('password', password)
    handleInputChange('confirm_password', password)
  }

  const validateForm = (): boolean => {
    if (!formData.email) {
      setError('Email is required')
      return false
    }
    if (!formData.email.includes('@')) {
      setError('Invalid email format')
      return false
    }
    if (!formData.password) {
      setError('Password is required')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      return false
    }
    if (!formData.full_name) {
      setError('Full name is required')
      return false
    }
    // Validate region assignment based on role
    switch (formData.role) {
      case 'province_admin':
        if (!formData.province_id) {
          setError('Province assignment is required')
          return false
        }
        break
      case 'district_admin':
        if (!formData.district_id) {
          setError('District assignment is required')
          return false
        }
        break
      case 'palika_admin':
        if (!formData.palika_id) {
          setError('Palika assignment is required')
          return false
        }
        break
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch('/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          province_id: formData.province_id,
          district_id: formData.district_id,
          palika_id: formData.palika_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create admin user')
        return
      }

      setSuccess(true)
      setTimeout(() => router.push('/admins'), 2000)
    } catch (err) {
      console.error('Error creating admin:', err)
      setError(err instanceof Error ? err.message : 'Failed to create admin user')
    } finally {
      setIsLoading(false)
    }
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
          <h1 className="text-3xl font-bold text-slate-900">Create Admin User</h1>
          <p className="text-slate-600 mt-1">Create an administrator for a new subscription. Choose the scope: Province (all palikas in province), District (all palikas in district), or single Palika.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">Admin user created successfully! Redirecting...</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Admin Details</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Admin Scope (Role) *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    handleInputChange('role', e.target.value)
                    // Reset region selections when role changes
                    handleInputChange('province_id', null)
                    handleInputChange('district_id', null)
                    handleInputChange('palika_id', null)
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  {formData.role === 'province_admin' && 'Admin will manage entire province and all palikas within it'}
                  {formData.role === 'district_admin' && 'Admin will manage entire district and all palikas within it'}
                  {formData.role === 'palika_admin' && 'Admin will manage single palika only'}
                </p>
              </div>

              {formData.role === 'province_admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign to Province *
                  </label>
                  <select
                    value={formData.province_id || ''}
                    onChange={(e) => handleInputChange('province_id', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a Province</option>
                    {provinces.map(province => (
                      <option key={province.id} value={province.id}>
                        {province.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'district_admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign to District *
                  </label>
                  <select
                    value={formData.district_id || ''}
                    onChange={(e) => handleInputChange('district_id', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a District</option>
                    {districts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.role === 'palika_admin' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign to Palika *
                  </label>
                  <select
                    value={formData.palika_id || ''}
                    onChange={(e) => handleInputChange('palika_id', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a Palika</option>
                    {palikas.map(palika => (
                      <option key={palika.id} value={palika.id}>
                        {palika.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">Password</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                <p className="mb-2">💡 <strong>Tip:</strong> Use the generate button below to create a secure temporary password, then share it with the new admin via a secure channel.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                onClick={handleGeneratePassword}
                className="w-full"
              >
                🔐 Generate Secure Password
              </Button>
            </CardContent>
          </Card>

          <div className="flex gap-3 mt-6">
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {isLoading ? 'Creating...' : 'Create Admin User'}
            </Button>
            <Link href="/admins">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}
