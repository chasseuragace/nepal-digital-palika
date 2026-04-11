'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/navigation'
import './events-new.css'

interface FormData {
  // Basic Information
  name_nepali: string
  name_english: string
  event_type: string
  status: string
  
  // Location & Dates
  address: string
  ward_number: number
  palika_id: string
  start_date: string
  end_date: string
  
  // Description
  short_description: string
  full_description: string
  
  // Event Details
  organizer: string
  contact_info: string
  entry_fee: string
  registration_required: boolean
  capacity: number
  
  // SEO
  meta_title: string
  meta_description: string
  keywords: string
  url_slug: string
}

interface Category {
  id: string
  name: string
  entity_type: string
}

interface Palika {
  id: string
  name_en: string
  name_ne: string
}

export default function NewEventPage() {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<FormData>({
    name_nepali: '',
    name_english: '',
    event_type: '',
    status: 'draft',
    address: '',
    ward_number: 1,
    palika_id: '',
    start_date: '',
    end_date: '',
    short_description: '',
    full_description: '',
    organizer: '',
    contact_info: '',
    entry_fee: '',
    registration_required: false,
    capacity: 0,
    meta_title: '',
    meta_description: '',
    keywords: '',
    url_slug: ''
  })
  
  const [categories, setCategories] = useState<Category[]>([])
  const [palikas, setPalikas] = useState<Palika[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const router = useRouter()

  useEffect(() => {
    fetchCategories()
    fetchPalikas()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?entity_type=event')
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
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

  const handleInputChange = (field: keyof FormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    if (field === 'name_english' && typeof value === 'string') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setFormData(prev => ({
        ...prev,
        url_slug: slug
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Event created successfully!')
        setTimeout(() => {
          router.push('/events')
        }, 2000)
      } else {
        setError(data.error || 'Failed to create event')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: '1', description: 'Name, type & dates' },
    { id: 'description', label: 'Description', icon: '2', description: 'Tell the story' },
    { id: 'details', label: 'Event Details', icon: '3', description: 'Organizer & logistics' },
    { id: 'seo', label: 'SEO & Metadata', icon: '4', description: 'Search optimization' }
  ]

  const getCurrentStepIndex = () => tabs.findIndex(tab => tab.id === activeTab)
  const progress = ((getCurrentStepIndex() + 1) / tabs.length) * 100

  return (
    <AdminLayout>
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
            <h1 className="page-title">Create Event</h1>
            <p className="page-subtitle">Share upcoming events with your community</p>
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
        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            Step {getCurrentStepIndex() + 1} of {tabs.length}
          </div>
        </div>

        <div className="tabs-container">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${index < getCurrentStepIndex() ? 'completed' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="tab-icon">{tab.icon}</div>
              <div className="tab-content">
                <div className="tab-label">{tab.label}</div>
                <div className="tab-description">{tab.description}</div>
              </div>
              {index < getCurrentStepIndex() && <div className="tab-check">✓</div>}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="heritage-form">
          {activeTab === 'basic' && (
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
                      placeholder="दशैं महोत्सव"
                    />
                  </div>

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
                      placeholder="Dashain Festival"
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
                      <option value="Cultural">Cultural</option>
                      <option value="Religious">Religious</option>
                      <option value="Sports">Sports</option>
                      <option value="Educational">Educational</option>
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
                      onChange={(e) => handleInputChange('status', e.target.value)}
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
                  <span className="form-card-icon-text">Location</span>
                  <h4>Location Details</h4>
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
                    placeholder="Basantapur Durbar Square"
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="ward_number" className="form-label">
                      Ward Number <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="ward_number"
                      className="form-input"
                      value={formData.ward_number}
                      onChange={(e) => handleInputChange('ward_number', parseInt(e.target.value))}
                      required
                      min="1"
                      max="35"
                    />
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
                      {palikas.map(palika => (
                        <option key={palika.id} value={palika.id}>
                          {palika.name_en}
                        </option>
                      ))}
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
              </div>
            </div>
          )}

          {activeTab === 'description' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Description & Story</h3>
                <p className="section-subtitle">Share the event details and significance</p>
              </div>
              
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Summary</span>
                  <h4>Short Description</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="short_description" className="form-label">
                    Brief Overview (100 words) <span className="required">*</span>
                  </label>
                  <textarea
                    id="short_description"
                    className="form-textarea"
                    value={formData.short_description}
                    onChange={(e) => handleInputChange('short_description', e.target.value)}
                    required
                    placeholder="Brief overview for listings and previews. Focus on what makes it unique."
                    rows={4}
                  />
                  <div className="help-text">
                    <span>Used for listings and previews. Keep it concise and engaging.</span>
                    <span className="char-count">{formData.short_description.length} characters</span>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Details</span>
                  <h4>Full Description</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="full_description" className="form-label">
                    Detailed Information (500-1000 words) <span className="required">*</span>
                  </label>
                  <textarea
                    id="full_description"
                    className="form-textarea"
                    value={formData.full_description}
                    onChange={(e) => handleInputChange('full_description', e.target.value)}
                    required
                    placeholder="Event background, cultural significance, activities, schedule, what to expect..."
                    rows={12}
                  />
                  <div className="help-text">
                    <div>
                      <strong>Include:</strong> Event background • Cultural significance • Activities • 
                      Schedule • What to expect • Special attractions
                    </div>
                    <span className="char-count">{formData.full_description.length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Event Details</h3>
                <p className="section-subtitle">Organizer information and logistics</p>
              </div>
              
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Organizer</span>
                  <h4>Organizer Information</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="organizer" className="form-label">
                    Organizer Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="organizer"
                    className="form-input"
                    value={formData.organizer}
                    onChange={(e) => handleInputChange('organizer', e.target.value)}
                    required
                    placeholder="Kathmandu Metropolitan City"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact_info" className="form-label">
                    Contact Information <span className="required">*</span>
                  </label>
                  <textarea
                    id="contact_info"
                    className="form-textarea"
                    value={formData.contact_info}
                    onChange={(e) => handleInputChange('contact_info', e.target.value)}
                    required
                    placeholder="Phone, email, website"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Logistics</span>
                  <h4>Event Logistics</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="entry_fee" className="form-label">
                      Entry Fee
                    </label>
                    <input
                      type="text"
                      id="entry_fee"
                      className="form-input"
                      value={formData.entry_fee}
                      onChange={(e) => handleInputChange('entry_fee', e.target.value)}
                      placeholder="Free / NPR 100"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="capacity" className="form-label">
                      Capacity (if limited)
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      className="form-input"
                      value={formData.capacity || ''}
                      onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
                      placeholder="0 for unlimited"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={formData.registration_required}
                      onChange={(e) => handleInputChange('registration_required', e.target.checked)}
                      style={{ width: 'auto' }}
                    />
                    Registration Required
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">SEO & Metadata</h3>
                <p className="section-subtitle">Optimize for search engines and social sharing</p>
              </div>
              
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">SEO</span>
                  <h4>Search Engine Optimization</h4>
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
                    placeholder="Auto-generated from event name or customize"
                  />
                  <div className="help-text">
                    Leave blank to auto-generate from event name
                  </div>
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
                    placeholder="Brief summary for search engines (150 characters max)"
                    maxLength={150}
                    rows={3}
                  />
                  <div className="help-text">
                    <span>Appears in search results. Make it compelling!</span>
                    <span className={`char-count ${formData.meta_description.length > 150 ? 'over-limit' : ''}`}>
                      {formData.meta_description.length}/150 characters
                    </span>
                  </div>
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
                    placeholder="festival, cultural, dashain, kathmandu"
                  />
                  <div className="help-text">
                    Comma-separated keywords for search optimization
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="url_slug" className="form-label">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    id="url_slug"
                    className="form-input"
                    value={formData.url_slug}
                    onChange={(e) => handleInputChange('url_slug', e.target.value)}
                    placeholder="dashain-festival-2024"
                  />
                  <div className="help-text">
                    Auto-generated from event name. Customize if needed.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="btn-group">
              {getCurrentStepIndex() > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(tabs[getCurrentStepIndex() - 1].id)}
                >
                  ← Previous
                </button>
              )}
              {getCurrentStepIndex() < tabs.length - 1 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(tabs[getCurrentStepIndex() + 1].id)}
                >
                  Next →
                </button>
              )}
            </div>
            {getCurrentStepIndex() === tabs.length - 1 && (
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
                    </svg>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Create Event
                  </>
                )}
              </button>
            )}
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
    </AdminLayout>
  )
}
