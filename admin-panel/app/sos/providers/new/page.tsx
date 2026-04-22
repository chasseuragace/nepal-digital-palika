'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService } from '@/lib/client/sos-client.service'

export default function NewProviderPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    name_en: '',
    name_ne: '',
    service_type: '',
    phone: '',
    email: '',
    latitude: 27.7172,
    longitude: 85.3240,
    address: '',
    ward_number: '',
    vehicle_count: 1,
    is_24_7: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const serviceTypes = ['ambulance', 'fire_brigade', 'police', 'rescue', 'disaster_management']
  const wards = Array.from({ length: 35 }, (_, i) => i + 1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name_en || !formData.service_type || !formData.phone) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      setError('')

      await sosClientService.createProvider({
        name_en: formData.name_en,
        name_ne: formData.name_ne || formData.name_en,
        service_type: formData.service_type,
        phone: formData.phone,
        email: formData.email,
        latitude: parseFloat(formData.latitude.toString()),
        longitude: parseFloat(formData.longitude.toString()),
        address: formData.address,
        ward_number: formData.ward_number ? parseInt(formData.ward_number) : null,
        vehicle_count: parseInt(formData.vehicle_count.toString()) || 1,
        is_24_7: formData.is_24_7,
      })

      router.push('/sos/providers')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">New Service Provider</h1>
            <p className="text-gray-600 mt-2">Create a new emergency service provider</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name (English) *
                    </label>
                    <input
                      type="text"
                      name="name_en"
                      value={formData.name_en}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="e.g., Metro Ambulance Service"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name (Nepali)
                    </label>
                    <input
                      type="text"
                      name="name_ne"
                      value={formData.name_ne}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="नेपाली नाम"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <select
                      name="service_type"
                      value={formData.service_type}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    >
                      <option value="">Select service type</option>
                      {serviceTypes.map(type => (
                        <option key={type} value={type}>
                          {type.replace(/_/g, ' ').charAt(0).toUpperCase() + type.replace(/_/g, ' ').slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available 24/7
                    </label>
                    <div className="flex items-center mt-3">
                      <input
                        type="checkbox"
                        name="is_24_7"
                        checked={formData.is_24_7}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Yes, 24/7 service</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="9841234567"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="provider@example.com"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Physical address"
                    rows={2}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      step="0.0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="27.7172"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      step="0.0001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      placeholder="85.3240"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ward Number
                  </label>
                  <select
                    name="ward_number"
                    value={formData.ward_number}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select ward</option>
                    {wards.map(ward => (
                      <option key={ward} value={ward}>
                        Ward {ward}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Operations */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Operations</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Vehicles
                  </label>
                  <input
                    type="number"
                    name="vehicle_count"
                    value={formData.vehicle_count}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Provider'}
                </button>
                <Link href="/sos/providers" className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300 text-center">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
