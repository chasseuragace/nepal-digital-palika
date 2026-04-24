'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AdminLayout from '@/components/AdminLayout'
import { sosClientService } from '@/lib/client/sos-client.service'
import './provider-new.css'

// Leaflet references `window` at module-eval time. Loading LocationPicker via
// dynamic import with ssr: false keeps the Leaflet chunk client-only.
const LocationPicker = dynamic(
  () => import('@/components/LocationPicker').then((m) => m.LocationPicker),
  { ssr: false }
)

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
      <div className="provider-new-container">
        {/* Header */}
        <div className="form-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <line x1="19" y1="8" x2="19" y2="14"></line>
                <line x1="22" y1="11" x2="16" y2="11"></line>
              </svg>
            </div>
            <div>
              <h1 className="page-title">New Service Provider</h1>
              <p className="page-subtitle">Create a new emergency service provider</p>
            </div>
          </div>
          <Link href="/sos/providers" className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to List
          </Link>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="error-banner">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {/* Form Card */}
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {/* Basic Info Section */}
            <div className="form-section">
              <div className="section-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <h2 className="section-title">Basic Information</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Name (English) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="name_en"
                    value={formData.name_en}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g., Metro Ambulance Service"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Name (Nepali)</label>
                  <input
                    type="text"
                    name="name_ne"
                    value={formData.name_ne}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="नेपाली नाम"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Service Type <span className="required">*</span>
                  </label>
                  <select
                    name="service_type"
                    value={formData.service_type}
                    onChange={handleChange}
                    className="form-select"
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

                <div className="form-group">
                  <label className="form-label">Available 24/7</label>
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      name="is_24_7"
                      checked={formData.is_24_7}
                      onChange={handleChange}
                      className="form-checkbox"
                      id="is_24_7"
                    />
                    <label htmlFor="is_24_7" className="checkbox-label">Yes, 24/7 service</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="form-section">
              <div className="section-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <h2 className="section-title">Contact Information</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Phone <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="9841234567"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="provider@example.com"
                  />
                </div>

                <div className="form-group form-group-full">
                  <label className="form-label">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="form-textarea"
                    placeholder="Physical address"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="form-section">
              <div className="section-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <h2 className="section-title">Location</h2>
              </div>

              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label className="form-label">Location on Map</label>
                  <LocationPicker
                    value={
                      formData.latitude && formData.longitude
                        ? { latitude: parseFloat(formData.latitude.toString()), longitude: parseFloat(formData.longitude.toString()) }
                        : null
                    }
                    onChange={(location) => {
                      setFormData(prev => ({
                        ...prev,
                        latitude: location.latitude,
                        longitude: location.longitude
                      }))
                    }}
                    height="400px"
                    defaultCenter={{ latitude: 27.7172, longitude: 85.3240 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    step="0.0001"
                    className="form-input"
                    placeholder="27.7172"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    step="0.0001"
                    className="form-input"
                    placeholder="85.3240"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ward Number</label>
                  <select
                    name="ward_number"
                    value={formData.ward_number}
                    onChange={handleChange}
                    className="form-select"
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
            </div>

            {/* Operations Section */}
            <div className="form-section">
              <div className="section-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                <h2 className="section-title">Operations</h2>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Number of Vehicles</label>
                  <input
                    type="number"
                    name="vehicle_count"
                    value={formData.vehicle_count}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn btn-primary btn-large">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                {loading ? 'Creating...' : 'Create Provider'}
              </button>
              <Link href="/sos/providers" className="btn btn-secondary btn-large">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}
