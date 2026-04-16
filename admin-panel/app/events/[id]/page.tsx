'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter, useParams } from 'next/navigation'
import { eventsService } from '@/lib/client/events-client.service'
import { palikaService } from '@/lib/client/palika-client.service'
import '../new/events-new.css'

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
      const data = await eventsService.getById(eventId)
      setFormData(data as any)
    } catch (error) {
      console.error('Error fetching event:', error)
      setError('Error loading event')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPalikas = async () => {
    try {
      const data = await palikaService.getPalikas()
      setPalikas(data.map(p => ({
        id: p.id.toString(),
        name_en: p.name_en,
        name_ne: p.name_ne || ''
      })))
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
      await eventsService.update(eventId, formData as any)
      setSuccess('Event updated successfully!')
      setTimeout(() => {
        router.push('/events')
      }, 2000)
    } catch (error) {
      console.error('Error updating event:', error)
      setError(error instanceof Error ? error.message : 'Failed to update event')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="events-container">
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading event...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="events-container">
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Edit Event</h1>
              <p className="page-subtitle">{formData.name_english}</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary header-cancel-btn"
            onClick={() => router.push('/events')}
          >
            ← Back to Events
          </button>
        </div>

        {error && (
          <div className="alert alert-error slide-in-up">
            <span className="alert-icon">✕</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success slide-in-up">
            <span className="alert-icon">✓</span>
            <span>{success}</span>
          </div>
        )}

        <div className="heritage-form-container">
          <form onSubmit={handleSubmit} className="heritage-form">
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Basic Information</h3>
                <p className="section-subtitle">Essential details about the event</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Names</span>
                  <h4>Event Names</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="name_english" className="form-label">
                      Event Name (English) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name_english"
                      className="form-input"
                      value={formData.name_english}
                      onChange={(e) => handleInputChange('name_english', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="name_nepali" className="form-label">
                      Event Name (Nepali) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name_nepali"
                      className="form-input"
                      value={formData.name_nepali}
                      onChange={(e) => handleInputChange('name_nepali', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Category</span>
                  <h4>Classification</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="event_type" className="form-label">
                      Event Type <span className="required">*</span>
                    </label>
                    <select
                      id="event_type"
                      className="form-select"
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
                    <label htmlFor="status" className="form-label">
                      Status <span className="required">*</span>
                    </label>
                    <select
                      id="status"
                      className="form-select"
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
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Dates</span>
                  <h4>Event Schedule</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="start_date" className="form-label">
                      Start Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      className="form-input"
                      value={formData.start_date}
                      onChange={(e) => handleInputChange('start_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_date" className="form-label">
                      End Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      className="form-input"
                      value={formData.end_date}
                      onChange={(e) => handleInputChange('end_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="start_time" className="form-label">
                      Start Time
                    </label>
                    <input
                      type="time"
                      id="start_time"
                      className="form-input"
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_time" className="form-label">
                      End Time
                    </label>
                    <input
                      type="time"
                      id="end_time"
                      className="form-input"
                      value={formData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Description</span>
                  <h4>Event Description</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="description" className="form-label">
                    Description <span className="required">*</span>
                  </label>
                  <textarea
                    id="description"
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                    placeholder="Detailed description of the event"
                    rows={8}
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Location</span>
                  <h4>Location Details</h4>
                </div>

                <div className="form-group">
                  <label htmlFor="palika_id" className="form-label">
                    Palika <span className="required">*</span>
                  </label>
                  <select
                    id="palika_id"
                    className="form-select"
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
                  <label htmlFor="location" className="form-label">
                    Location Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="location"
                    className="form-input"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required
                    placeholder="e.g., City Hall, Community Center"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Address <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    required
                    placeholder="Full address"
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="latitude" className="form-label">
                      Latitude
                    </label>
                    <input
                      type="number"
                      id="latitude"
                      className="form-input"
                      value={formData.latitude || ''}
                      onChange={(e) => handleInputChange('latitude', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      step="any"
                      placeholder="27.7172"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitude" className="form-label">
                      Longitude
                    </label>
                    <input
                      type="number"
                      id="longitude"
                      className="form-input"
                      value={formData.longitude || ''}
                      onChange={(e) => handleInputChange('longitude', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      step="any"
                      placeholder="85.3240"
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Organizer</span>
                  <h4>Organizer Information</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="organizer_name" className="form-label">
                      Organizer Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="organizer_name"
                      className="form-input"
                      value={formData.organizer_name}
                      onChange={(e) => handleInputChange('organizer_name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organizer_contact" className="form-label">
                      Organizer Contact <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="organizer_contact"
                      className="form-input"
                      value={formData.organizer_contact}
                      onChange={(e) => handleInputChange('organizer_contact', e.target.value)}
                      required
                      placeholder="Phone or email"
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Media & SEO</span>
                  <h4>Media & SEO</h4>
                </div>

                <div className="form-group">
                  <label htmlFor="featured_image_url" className="form-label">
                    Featured Image URL
                  </label>
                  <input
                    type="url"
                    id="featured_image_url"
                    className="form-input"
                    value={formData.featured_image_url}
                    onChange={(e) => handleInputChange('featured_image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meta_title" className="form-label">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="meta_title"
                    className="form-input"
                    value={formData.meta_title}
                    onChange={(e) => handleInputChange('meta_title', e.target.value)}
                    placeholder="SEO title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="meta_description" className="form-label">
                    Meta Description
                  </label>
                  <textarea
                    id="meta_description"
                    className="form-textarea"
                    value={formData.meta_description}
                    onChange={(e) => handleInputChange('meta_description', e.target.value)}
                    placeholder="SEO description"
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="keywords" className="form-label">
                    Keywords
                  </label>
                  <input
                    type="text"
                    id="keywords"
                    className="form-input"
                    value={formData.keywords}
                    onChange={(e) => handleInputChange('keywords', e.target.value)}
                    placeholder="Comma-separated keywords"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Update Event
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => router.push('/events')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <style jsx>{`
          .spinner {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AdminLayout>
  )
}