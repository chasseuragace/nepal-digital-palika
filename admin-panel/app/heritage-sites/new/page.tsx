'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/navigation'
import { categoriesService, type Category } from '@/lib/client/categories-client.service'
import { palikaService, type Palika } from '@/lib/client/palika-client.service'
import { heritageSitesService } from '@/lib/client/heritage-sites-client.service'
import './heritage-sites-new.css'

interface FormData {
  // Basic Information Tab
  name_nepali: string
  name_english: string
  category: string
  type: string
  status: string

  // Location
  address: string
  ward_number: number
  palika_id: string
  latitude: number
  longitude: number
  altitude: number

  // Description Tab
  short_description: string
  full_description: string

  // Visitor Information Tab
  opening_hours: string
  entry_fee: string
  best_time_to_visit: string
  time_needed: string
  accessibility: string
  facilities: string
  restrictions: string
  contact_info: string

  // SEO and Metadata
  meta_title: string
  meta_description: string
  keywords: string
  url_slug: string
}

export default function NewHeritageSitePage() {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<FormData>({
    name_nepali: '',
    name_english: '',
    category: '',
    type: '',
    status: 'Active',
    address: '',
    ward_number: 1,
    palika_id: '',
    latitude: 0,
    longitude: 0,
    altitude: 0,
    short_description: '',
    full_description: '',
    opening_hours: '',
    entry_fee: '',
    best_time_to_visit: '',
    time_needed: '',
    accessibility: '',
    facilities: '',
    restrictions: '',
    contact_info: '',
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
      const data = await categoriesService.getByEntityType('heritage_site')
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const fetchPalikas = async () => {
    try {
      const data = await palikaService.getPalikas()
      setPalikas(data)
    } catch (error) {
      console.error('Error fetching palikas:', error)
      setPalikas([])
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Auto-generate URL slug from English name
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
      await heritageSitesService.create(formData as any)
      setSuccess('Heritage site created successfully!')
      setTimeout(() => {
        router.push('/heritage-sites')
      }, 2000)
    } catch (err) {
      console.error('Error creating heritage site:', err)
      setError(err instanceof Error ? err.message : 'Failed to create heritage site')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: '1', description: 'Name, category & location' },
    { id: 'description', label: 'Description', icon: '2', description: 'Tell the story' },
    { id: 'visitor', label: 'Visitor Info', icon: '3', description: 'Hours, fees & facilities' },
    { id: 'seo', label: 'SEO & Metadata', icon: '4', description: 'Search optimization' }
  ]

  const getCurrentStepIndex = () => tabs.findIndex(tab => tab.id === activeTab)
  const progress = ((getCurrentStepIndex() + 1) / tabs.length) * 100

  return (
    <AdminLayout>
      <div className="heritage-container">
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Create Heritage Site</h1>
              <p className="page-subtitle">Preserve history, share culture, inspire visitors</p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary header-cancel-btn"
            onClick={() => router.push('/heritage-sites')}
          >
            ← Back to Sites
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
          <form onSubmit={handleSubmit}>
            <div className="progress-section">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="progress-text">
                Step {getCurrentStepIndex() + 1} of {tabs.length}
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="tabs-container">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${index < getCurrentStepIndex() ? 'completed' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="tab-icon">{tab.icon}</div>
                  <div className="tab-content">
                    <div className="tab-label">{tab.label}</div>
                    <div className="tab-description">{tab.description}</div>
                  </div>
                </button>
              ))}
            </div>

            {activeTab === 'basic' && (
              <div className="form-section fade-in">
                <div className="section-header">
                  <h3 className="section-title">Basic Information</h3>
                  <p className="section-subtitle">Name, category & location</p>
                </div>

                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Name</span>
                    <h4>Site Name</h4>
                  </div>
                  <div className="grid grid-2">
                    <div className="form-group">
                      <label htmlFor="name_nepali" className="form-label">
                        Site Name (Nepali) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name_nepali"
                        className="form-input"
                        value={formData.name_nepali}
                        onChange={(e) => handleInputChange('name_nepali', e.target.value)}
                        required
                        placeholder="श्री स्वयम्भू महाचैत्य"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="name_english" className="form-label">
                        Site Name (English) <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name_english"
                        className="form-input"
                        value={formData.name_english}
                        onChange={(e) => handleInputChange('name_english', e.target.value)}
                        required
                        placeholder="Swayambhunath Stupa"
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
                    <label htmlFor="category" className="form-label">
                      Category <span className="required">*</span>
                    </label>
                    <select
                      id="category"
                      className="form-select"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="type" className="form-label">
                      Type <span className="required">*</span>
                    </label>
                    <select
                      id="type"
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="Religious">Religious</option>
                      <option value="Historical">Historical</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Archaeological">Archaeological</option>
                      <option value="Natural">Natural</option>
                    </select>
                  </div>
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
                    <option value="Active">Active</option>
                    <option value="Under Renovation">Under Renovation</option>
                    <option value="Restricted">Restricted</option>
                  </select>
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
                    placeholder="Swayambhu, Kathmandu"
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
                        <option key={palika.id} value={palika.id.toString()}>
                          {palika.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="coordinates-section">
                  <div className="coordinates-header">
                    <span>Geographic Coordinates</span>
                    <small className="help-text">Use Google Maps to find precise coordinates</small>
                  </div>
                  <div className="grid grid-3">
                    <div className="form-group">
                      <label htmlFor="latitude" className="form-label">
                        Latitude <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="latitude"
                        className="form-input"
                        value={formData.latitude || ''}
                        onChange={(e) => handleInputChange('latitude', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        required
                        step="0.000001"
                        placeholder="27.7172"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="longitude" className="form-label">
                        Longitude <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="longitude"
                        className="form-input"
                        value={formData.longitude || ''}
                        onChange={(e) => handleInputChange('longitude', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        required
                        step="0.000001"
                        placeholder="85.2903"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="altitude" className="form-label">
                        Altitude (meters)
                      </label>
                      <input
                        type="number"
                        id="altitude"
                        className="form-input"
                        value={formData.altitude || ''}
                        onChange={(e) => handleInputChange('altitude', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        placeholder="77"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

          {activeTab === 'description' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Description & Story</h3>
                <p className="section-subtitle">Share the heritage, history, and significance</p>
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
                    placeholder="Brief overview for listings and previews. Focus on what makes it unique. Mention main features."
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
                    placeholder="Historical background, architectural significance, cultural importance, legends and stories, notable features, best time to visit..."
                    rows={12}
                  />
                  <div className="help-text">
                    <div>
                      <strong>Include:</strong> Historical background • Architectural significance • Cultural importance • 
                      Legends and stories • Notable features • Best time to visit
                    </div>
                    <span className="char-count">{formData.full_description.length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'visitor' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Visitor Information</h3>
                <p className="section-subtitle">Help visitors plan their experience</p>
              </div>
              
              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Schedule</span>
                  <h4>Timing & Fees</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="opening_hours" className="form-label">
                      Opening Hours
                    </label>
                    <input
                      type="text"
                      id="opening_hours"
                      className="form-input"
                      value={formData.opening_hours}
                      onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                      placeholder="24 hours / 6:00 AM - 6:00 PM"
                    />
                  </div>

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
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="best_time_to_visit" className="form-label">
                      Best Time to Visit
                    </label>
                    <input
                      type="text"
                      id="best_time_to_visit"
                      className="form-input"
                      value={formData.best_time_to_visit}
                      onChange={(e) => handleInputChange('best_time_to_visit', e.target.value)}
                      placeholder="Morning / Evening / October-March"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="time_needed" className="form-label">
                      Time Needed
                    </label>
                    <input
                      type="text"
                      id="time_needed"
                      className="form-input"
                      value={formData.time_needed}
                      onChange={(e) => handleInputChange('time_needed', e.target.value)}
                      placeholder="1-2 hours"
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Access</span>
                  <h4>Accessibility</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="accessibility" className="form-label">
                    Accessibility Information
                  </label>
                  <textarea
                    id="accessibility"
                    className="form-textarea"
                    value={formData.accessibility}
                    onChange={(e) => handleInputChange('accessibility', e.target.value)}
                    placeholder="Wheelchair accessible? Steps? Level entrance? Special accommodations available?"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Amenities</span>
                  <h4>Facilities & Services</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="facilities" className="form-label">
                    Available Facilities
                  </label>
                  <textarea
                    id="facilities"
                    className="form-textarea"
                    value={formData.facilities}
                    onChange={(e) => handleInputChange('facilities', e.target.value)}
                    placeholder="Parking, restrooms, water, guide services, gift shop, etc."
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Rules</span>
                  <h4>Rules & Restrictions</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="restrictions" className="form-label">
                    Visitor Restrictions
                  </label>
                  <textarea
                    id="restrictions"
                    className="form-textarea"
                    value={formData.restrictions}
                    onChange={(e) => handleInputChange('restrictions', e.target.value)}
                    placeholder="Dress code, photography rules, behavior guidelines, prohibited items"
                    rows={3}
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Contact</span>
                  <h4>Contact Information</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="contact_info" className="form-label">
                    Contact Details
                  </label>
                  <textarea
                    id="contact_info"
                    className="form-textarea"
                    value={formData.contact_info}
                    onChange={(e) => handleInputChange('contact_info', e.target.value)}
                    placeholder="Caretaker name and phone, website, email"
                    rows={3}
                  />
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
                    placeholder="Auto-generated from site name or customize"
                  />
                  <div className="help-text">
                    Leave blank to auto-generate from site name
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
                    placeholder="temple, stupa, buddhist, swayambhunath (comma separated)"
                  />
                  <div className="help-text">
                    Separate keywords with commas
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">URL</span>
                  <h4>URL Configuration</h4>
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
                    placeholder="swayambhunath-stupa"
                  />
                  <div className="help-text">
                    <span>Auto-generated from English name</span>
                    {formData.url_slug && (
                      <span className="url-preview">
                        Preview: /heritage-sites/{formData.url_slug}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="form-actions-left">
              {getCurrentStepIndex() > 0 && (
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(tabs[getCurrentStepIndex() - 1].id)}
                >
                  ← Previous
                </button>
              )}
            </div>
            
            <div className="form-actions-right">
              {getCurrentStepIndex() < tabs.length - 1 ? (
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => setActiveTab(tabs[getCurrentStepIndex() + 1].id)}
                >
                  Next Step →
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn btn-primary btn-submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Creating Heritage Site...
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      Create Heritage Site
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
      </div>
    </AdminLayout>
  )
}