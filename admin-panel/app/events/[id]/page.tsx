'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface FormData {
  name_english: string
  name_nepali: string
  event_type: string
  description: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  location: string
  address: string
  palika_id: string
  latitude: number
  longitude: number
  status: 'published' | 'draft' | 'cancelled'
  organizer_name: string
  organizer_contact: string
  featured_image_url: string
  meta_title: string
  meta_description: string
  keywords: string
}

interface Palika {
  id: string
  name_en: string
  name_ne: string
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [formData, setFormData] = useState<FormData>({
    name_english: '',
    name_nepali: '',
    event_type: '',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    location: '',
    address: '',
    palika_id: '',
    latitude: 0,
    longitude: 0,
    status: 'draft',
    organizer_name: '',
    organizer_contact: '',
    featured_image_url: '',
    meta_title: '',
    meta_description: '',
    keywords: ''
  })

  const [palikas, setPalikas] = useState<Palika[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchEvent()
    fetchPalikas()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setFormData(data)
      } else {
        setError('Failed to load event')
      }
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Error loading event')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPalikas = async () => {
    try {
      const response = await fetch('/api/palikas')
      if (response.ok) {
        const data = await response.json()
        setPalikas(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching palikas:', error)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Event updated successfully!')
        setTimeout(() => {
          router.push('/events')
        }, 2000)
      } else {
        setError(data.error || 'Failed to update event')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ padding: '20px' }}>Loading event...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/events" className="btn btn-secondary">
          ← Back to Events
        </Link>
      </div>

      <h1>Edit Event: {formData.name_english}</h1>

      {error && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: '#d4edda',
          color: '#155724',
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <h3>Basic Information</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="name_english">Event Name (English) *</label>
              <input
                type="text"
                id="name_english"
                value={formData.name_english}
                onChange={(e) => handleInputChange('name_english', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name_nepali">Event Name (Nepali) *</label>
              <input
                type="text"
                id="name_nepali"
                value={formData.name_nepali}
                onChange={(e) => handleInputChange('name_nepali', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="event_type">Event Type *</label>
              <select
                id="event_type"
                value={formData.event_type}
                onChange={(e) => handleInputChange('event_type', e.target.value)}
                required
              >
                <option value="">Select Type</option>
                <option value="Festival">Festival</option>
                <option value="Conference">Conference</option>
                <option value="Workshop">Workshop</option>
                <option value="Cultural">Cultural</option>
                <option value="Religious">Religious</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as any)}
                required
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              placeholder="Detailed description of the event"
              style={{ minHeight: '150px' }}
            />
          </div>

          <h3>Date & Time</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="start_date">Start Date *</label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_date">End Date *</label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="start_time">Start Time</label>
              <input
                type="time"
                id="start_time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end_time">End Time</label>
              <input
                type="time"
                id="end_time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
            </div>
          </div>

          <h3>Location</h3>

          <div className="form-group">
            <label htmlFor="palika_id">Palika *</label>
            <select
              id="palika_id"
              value={formData.palika_id}
              onChange={(e) => handleInputChange('palika_id', e.target.value)}
              required
            >
              <option value="">Select Palika</option>
              {palikas.map((palika) => (
                <option key={palika.id} value={palika.id}>
                  {palika.name_en} ({palika.name_ne})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">Location Name *</label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
              placeholder="e.g., City Hall, Community Center"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
              placeholder="Full address"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="latitude">Latitude</label>
              <input
                type="number"
                id="latitude"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                step="any"
                placeholder="27.7172"
              />
            </div>

            <div className="form-group">
              <label htmlFor="longitude">Longitude</label>
              <input
                type="number"
                id="longitude"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                step="any"
                placeholder="85.3240"
              />
            </div>
          </div>

          <h3>Organizer Information</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="organizer_name">Organizer Name *</label>
              <input
                type="text"
                id="organizer_name"
                value={formData.organizer_name}
                onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="organizer_contact">Organizer Contact *</label>
              <input
                type="text"
                id="organizer_contact"
                value={formData.organizer_contact}
                onChange={(e) => handleInputChange('organizer_contact', e.target.value)}
                required
                placeholder="Phone or email"
              />
            </div>
          </div>

          <h3>Media & SEO</h3>

          <div className="form-group">
            <label htmlFor="featured_image_url">Featured Image URL</label>
            <input
              type="url"
              id="featured_image_url"
              value={formData.featured_image_url}
              onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-group">
            <label htmlFor="meta_title">Meta Title</label>
            <input
              type="text"
              id="meta_title"
              value={formData.meta_title}
              onChange={(e) => handleInputChange('meta_title', e.target.value)}
              placeholder="SEO title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="meta_description">Meta Description</label>
            <textarea
              id="meta_description"
              value={formData.meta_description}
              onChange={(e) => handleInputChange('meta_description', e.target.value)}
              placeholder="SEO description"
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="keywords">Keywords</label>
            <input
              type="text"
              id="keywords"
              value={formData.keywords}
              onChange={(e) => handleInputChange('keywords', e.target.value)}
              placeholder="Comma-separated keywords"
            />
          </div>

          <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Update Event'}
            </button>
            <Link href="/events" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}