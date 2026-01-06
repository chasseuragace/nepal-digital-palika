'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { useRouter } from 'next/navigation'

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
      const response = await fetch('/api/categories?entity_type=heritage_site')
      if (response.ok) {
        const data = await response.json()
        setCategories(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch categories')
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const fetchPalikas = async () => {
    try {
      const response = await fetch('/api/palikas')
      if (response.ok) {
        const data = await response.json()
        setPalikas(Array.isArray(data) ? data : [])
      } else {
        console.error('Failed to fetch palikas')
        setPalikas([])
      }
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
      const response = await fetch('/api/heritage-sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Heritage site created successfully!')
        setTimeout(() => {
          router.push('/heritage-sites')
        }, 2000)
      } else {
        setError(data.error || 'Failed to create heritage site')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'description', label: 'Description' },
    { id: 'visitor', label: 'Visitor Information' },
    { id: 'seo', label: 'SEO & Metadata' }
  ]

  return (
    <AdminLayout>
      <h1>Add New Heritage Site</h1>
      
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="card">
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'active' : ''}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'basic' && (
            <div>
              <h3>Basic Information</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="name_nepali">Site Name (Nepali) *</label>
                  <input
                    type="text"
                    id="name_nepali"
                    value={formData.name_nepali}
                    onChange={(e) => handleInputChange('name_nepali', e.target.value)}
                    required
                    placeholder="श्री स्वयम्भू महाचैत्य"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="name_english">Site Name (English) *</label>
                  <input
                    type="text"
                    id="name_english"
                    value={formData.name_english}
                    onChange={(e) => handleInputChange('name_english', e.target.value)}
                    required
                    placeholder="Swayambhunath Stupa"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
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
                  <label htmlFor="type">Type *</label>
                  <select
                    id="type"
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
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Under Renovation">Under Renovation</option>
                  <option value="Restricted">Restricted</option>
                </select>
              </div>

              <h4>Location</h4>
              
              <div className="form-group">
                <label htmlFor="address">Address *</label>
                <input
                  type="text"
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  required
                  placeholder="Swayambhu, Kathmandu"
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="ward_number">Ward Number *</label>
                  <input
                    type="number"
                    id="ward_number"
                    value={formData.ward_number}
                    onChange={(e) => handleInputChange('ward_number', parseInt(e.target.value))}
                    required
                    min="1"
                    max="35"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="palika_id">Palika *</label>
                  <select
                    id="palika_id"
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

              <div className="grid grid-3">
                <div className="form-group">
                  <label htmlFor="latitude">Latitude *</label>
                  <input
                    type="number"
                    id="latitude"
                    value={formData.latitude}
                    onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value))}
                    required
                    step="0.000001"
                    placeholder="27.7172"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="longitude">Longitude *</label>
                  <input
                    type="number"
                    id="longitude"
                    value={formData.longitude}
                    onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value))}
                    required
                    step="0.000001"
                    placeholder="85.2903"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="altitude">Altitude (meters)</label>
                  <input
                    type="number"
                    id="altitude"
                    value={formData.altitude}
                    onChange={(e) => handleInputChange('altitude', parseFloat(e.target.value))}
                    placeholder="77"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'description' && (
            <div>
              <h3>Description</h3>
              
              <div className="form-group">
                <label htmlFor="short_description">Short Description (100 words) *</label>
                <textarea
                  id="short_description"
                  value={formData.short_description}
                  onChange={(e) => handleInputChange('short_description', e.target.value)}
                  required
                  placeholder="Brief overview for listings and previews. Focus on what makes it unique. Mention main features."
                  style={{ minHeight: '80px' }}
                />
                <small>Used for listings and previews. Keep it concise and engaging.</small>
              </div>

              <div className="form-group">
                <label htmlFor="full_description">Full Description (500-1000 words) *</label>
                <textarea
                  id="full_description"
                  value={formData.full_description}
                  onChange={(e) => handleInputChange('full_description', e.target.value)}
                  required
                  placeholder="Historical background, architectural significance, cultural importance, legends and stories, notable features, best time to visit..."
                  style={{ minHeight: '200px' }}
                />
                <small>
                  Include: Historical background, architectural significance, cultural importance, 
                  legends and stories, notable features, best time to visit. Start with the most interesting fact.
                </small>
              </div>
            </div>
          )}

          {activeTab === 'visitor' && (
            <div>
              <h3>Visitor Information</h3>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="opening_hours">Opening Hours</label>
                  <input
                    type="text"
                    id="opening_hours"
                    value={formData.opening_hours}
                    onChange={(e) => handleInputChange('opening_hours', e.target.value)}
                    placeholder="24 hours / 6:00 AM - 6:00 PM"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="entry_fee">Entry Fee</label>
                  <input
                    type="text"
                    id="entry_fee"
                    value={formData.entry_fee}
                    onChange={(e) => handleInputChange('entry_fee', e.target.value)}
                    placeholder="Free / NPR 100"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="best_time_to_visit">Best Time to Visit</label>
                  <input
                    type="text"
                    id="best_time_to_visit"
                    value={formData.best_time_to_visit}
                    onChange={(e) => handleInputChange('best_time_to_visit', e.target.value)}
                    placeholder="Morning / Evening / October-March"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="time_needed">Time Needed</label>
                  <input
                    type="text"
                    id="time_needed"
                    value={formData.time_needed}
                    onChange={(e) => handleInputChange('time_needed', e.target.value)}
                    placeholder="1-2 hours"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="accessibility">Accessibility</label>
                <textarea
                  id="accessibility"
                  value={formData.accessibility}
                  onChange={(e) => handleInputChange('accessibility', e.target.value)}
                  placeholder="Wheelchair accessible? Steps? Level entrance? Special accommodations available?"
                />
              </div>

              <div className="form-group">
                <label htmlFor="facilities">Facilities</label>
                <textarea
                  id="facilities"
                  value={formData.facilities}
                  onChange={(e) => handleInputChange('facilities', e.target.value)}
                  placeholder="Parking, restrooms, water, guide services, gift shop, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="restrictions">Restrictions</label>
                <textarea
                  id="restrictions"
                  value={formData.restrictions}
                  onChange={(e) => handleInputChange('restrictions', e.target.value)}
                  placeholder="Dress code, photography rules, behavior guidelines, prohibited items"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_info">Contact Information</label>
                <textarea
                  id="contact_info"
                  value={formData.contact_info}
                  onChange={(e) => handleInputChange('contact_info', e.target.value)}
                  placeholder="Caretaker name and phone, website, email"
                />
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <div>
              <h3>SEO and Metadata</h3>
              
              <div className="form-group">
                <label htmlFor="meta_title">Meta Title</label>
                <input
                  type="text"
                  id="meta_title"
                  value={formData.meta_title}
                  onChange={(e) => handleInputChange('meta_title', e.target.value)}
                  placeholder="Auto-generated from site name or customize"
                />
                <small>Leave blank to auto-generate from site name</small>
              </div>

              <div className="form-group">
                <label htmlFor="meta_description">Meta Description (150 characters)</label>
                <textarea
                  id="meta_description"
                  value={formData.meta_description}
                  onChange={(e) => handleInputChange('meta_description', e.target.value)}
                  placeholder="Brief summary for search engines (150 characters max)"
                  maxLength={150}
                />
                <small>{formData.meta_description.length}/150 characters</small>
              </div>

              <div className="form-group">
                <label htmlFor="keywords">Keywords</label>
                <input
                  type="text"
                  id="keywords"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  placeholder="temple, stupa, buddhist, swayambhunath (comma separated)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="url_slug">URL Slug</label>
                <input
                  type="text"
                  id="url_slug"
                  value={formData.url_slug}
                  onChange={(e) => handleInputChange('url_slug', e.target.value)}
                  placeholder="swayambhunath-stupa"
                />
                <small>Auto-generated from English name. URL will be: /heritage-sites/{formData.url_slug}</small>
              </div>
            </div>
          )}

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Heritage Site...' : 'Create Heritage Site'}
            </button>
            
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => router.push('/heritage-sites')}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}