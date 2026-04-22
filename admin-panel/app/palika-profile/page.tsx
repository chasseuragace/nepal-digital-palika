'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import AssetGallery from '@/components/AssetGallery'
import { palikaProfileService, type PalikaProfile } from '@/lib/client/palika-profile-client.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import './palika-profile.css'

interface Asset {
  id: string
  public_url: string
  storage_path: string
  display_name: string
}

interface PalikaProfileFormData {
  description_en: string
  description_ne: string
  featured_image: string
  highlights: Array<{ title: string; description: string; image_url?: string }>
  tourism_info: {
    best_time_to_visit?: string
    accessibility?: string
    languages?: string[]
    currency?: string
    image_url?: string
  }
  demographics: {
    population?: number
    area_sq_km?: number
    established_year?: number
  }
  videos: string[]

  // Contact info (palikas table)
  office_phone?: string
  office_email?: string
  website?: string
  total_wards?: number
}

type TabId = 'overview' | 'tourism' | 'highlights' | 'media'

const TABS: Array<{ id: TabId; label: string; icon: string; description: string }> = [
  { id: 'overview', label: 'Overview', icon: '1', description: 'Descriptions & contact' },
  { id: 'tourism', label: 'Tourism', icon: '2', description: 'Visitor information' },
  { id: 'highlights', label: 'Highlights & Gallery', icon: '3', description: 'Attractions & photos' },
  { id: 'media', label: 'Media', icon: '4', description: 'YouTube videos' }
]

export default function PalikaProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [profile, setProfile] = useState<PalikaProfile | null>(null)
  const [palikaId, setPalikaId] = useState<number | null>(null)
  const [formData, setFormData] = useState<PalikaProfileFormData>({
    description_en: '',
    description_ne: '',
    featured_image: '',
    highlights: [{ title: '', description: '' }],
    tourism_info: {
      best_time_to_visit: '',
      accessibility: '',
      languages: [],
      currency: 'NPR'
    },
    demographics: {
      population: 0,
      area_sq_km: 0,
      established_year: 0
    },
    videos: [],
    office_phone: '',
    office_email: '',
    website: '',
    total_wards: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [selectedImageField, setSelectedImageField] = useState<'featured_image' | `highlight_${number}` | 'tourism_info' | null>(null)

  useEffect(() => {
    fetchPalikaProfile()
  }, [])

  const fetchPalikaProfile = async () => {
    try {
      const admin = adminSessionStore.get()

      if (!admin?.palika_id) {
        setMessage({ type: 'error', text: 'No palika assigned to this admin' })
        setIsLoading(false)
        return
      }

      setPalikaId(admin.palika_id)

      const data = await palikaProfileService.getByPalikaId(admin.palika_id)

      if (data.profile) {
        setProfile(data.profile)
        setFormData({
          description_en: data.profile.description_en || '',
          description_ne: data.profile.description_ne || '',
          featured_image: data.profile.featured_image || '',
          highlights: data.profile.highlights?.length ? data.profile.highlights : [{ title: '', description: '' }],
          tourism_info: data.profile.tourism_info || {
            best_time_to_visit: '',
            accessibility: '',
            languages: [],
            currency: 'NPR'
          },
          demographics: data.profile.demographics || {
            population: 0,
            area_sq_km: 0,
            established_year: 0
          },
          videos: data.profile.videos || [],
          office_phone: data.profile.office_phone || '',
          office_email: data.profile.office_email || '',
          website: data.profile.website || '',
          total_wards: data.profile.total_wards ?? 0
        })
      }
    } catch (error) {
      console.error('Error fetching palika profile:', error)
      setMessage({ type: 'error', text: 'Failed to load palika profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof PalikaProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNestedChange = (parent: 'tourism_info' | 'demographics', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as Record<string, any>),
        [field]: value
      }
    }))
  }

  const handleHighlightChange = (index: number, field: string, value: string) => {
    const newHighlights = [...formData.highlights]
    newHighlights[index] = { ...newHighlights[index], [field]: value }
    setFormData(prev => ({ ...prev, highlights: newHighlights }))
  }

  const addHighlight = () => {
    setFormData(prev => ({
      ...prev,
      highlights: [...prev.highlights, { title: '', description: '' }]
    }))
  }

  const removeHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights.filter((_, i) => i !== index)
    }))
  }

  const addVideo = () => {
    setFormData(prev => ({ ...prev, videos: [...prev.videos, ''] }))
  }

  const removeVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }))
  }

  const handleVideoChange = (index: number, value: string) => {
    const newVideos = [...formData.videos]
    newVideos[index] = value
    setFormData(prev => ({ ...prev, videos: newVideos }))
  }

  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const getYouTubeEmbedUrl = (url: string): string | null => {
    const videoId = extractYouTubeId(url)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const handleAssetSelect = (asset: Asset) => {
    const publicUrl = asset.public_url

    if (selectedImageField === 'featured_image') {
      setFormData(prev => ({ ...prev, featured_image: publicUrl }))
    } else if (selectedImageField === 'tourism_info') {
      setFormData(prev => ({
        ...prev,
        tourism_info: { ...prev.tourism_info, image_url: publicUrl }
      }))
    } else if (selectedImageField?.startsWith('highlight_')) {
      const highlightIndex = parseInt(selectedImageField.split('_')[1])
      const newHighlights = [...formData.highlights]
      newHighlights[highlightIndex] = { ...newHighlights[highlightIndex], image_url: publicUrl }
      setFormData(prev => ({ ...prev, highlights: newHighlights }))
    }

    setShowGalleryModal(false)
    setSelectedImageField(null)
  }

  const openGalleryModal = (field: 'featured_image' | `highlight_${number}` | 'tourism_info') => {
    setSelectedImageField(field)
    setShowGalleryModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const admin = adminSessionStore.get()

      if (!admin?.palika_id) {
        setMessage({ type: 'error', text: 'No palika assigned to this admin' })
        return
      }

      const data = await palikaProfileService.update(admin.palika_id, formData)

      if (data.warning) {
        setMessage({ type: 'warning', text: data.warning })
      } else {
        setMessage({ type: 'success', text: 'Palika profile updated successfully!' })
      }
      setProfile(data.profile)
    } catch (error) {
      console.error('Error saving palika profile:', error)
      const text = error instanceof Error ? error.message : 'Failed to save palika profile'
      setMessage({ type: 'error', text })
    } finally {
      setIsSaving(false)
    }
  }

  const currentStepIndex = TABS.findIndex(t => t.id === activeTab)
  const progress = ((currentStepIndex + 1) / TABS.length) * 100
  const isLastStep = currentStepIndex === TABS.length - 1

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="heritage-container">
          <div className="loading-container">
            <div className="spinner-large" />
            <p>Loading palika profile...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="heritage-container">
        {/* Page Header */}
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" />
                <path d="M5 21V7l7-4 7 4v14" />
                <path d="M9 9h1" />
                <path d="M9 13h1" />
                <path d="M9 17h1" />
                <path d="M14 9h1" />
                <path d="M14 13h1" />
                <path d="M14 17h1" />
              </svg>
            </div>
            <div>
              <h1 className="page-title">Palika Profile</h1>
              <p className="page-subtitle">Showcase your palika to the world</p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary header-cancel-btn"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
        </div>

        {/* Alerts */}
        {message && message.type === 'error' && (
          <div className="alert alert-error slide-in-up">
            <span className="alert-icon">✕</span>
            <span>{message.text}</span>
          </div>
        )}
        {message && message.type === 'success' && (
          <div className="alert alert-success slide-in-up">
            <span className="alert-icon">✓</span>
            <span>{message.text}</span>
          </div>
        )}
        {message && message.type === 'warning' && (
          <div className="alert alert-warning slide-in-up">
            <span className="alert-icon">!</span>
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <div className="heritage-form-container">
          <form onSubmit={handleSubmit}>
            {/* Progress */}
            <div className="progress-section">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-text">
                Step {currentStepIndex + 1} of {TABS.length}
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              {TABS.map((tab, index) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${index < currentStepIndex ? 'completed' : ''}`}
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

            {/* ---- Overview Tab ---- */}
            {activeTab === 'overview' && (
              <div className="form-section fade-in">
                <div className="section-header">
                  <h3 className="section-title">Overview</h3>
                  <p className="section-subtitle">Descriptions, featured image, and contact information</p>
                </div>

                {/* Descriptions */}
                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Story</span>
                    <h4>Descriptions</h4>
                  </div>

                  <div className="form-group">
                    <label htmlFor="description_en" className="form-label">
                      Description (English) <span className="required">*</span>
                    </label>
                    <textarea
                      id="description_en"
                      className="form-textarea"
                      value={formData.description_en}
                      onChange={(e) => handleInputChange('description_en', e.target.value)}
                      rows={5}
                      placeholder="Enter English description of the palika"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description_ne" className="form-label">
                      Description (Nepali)
                    </label>
                    <textarea
                      id="description_ne"
                      className="form-textarea"
                      value={formData.description_ne}
                      onChange={(e) => handleInputChange('description_ne', e.target.value)}
                      rows={5}
                      placeholder="पालिकाको नेपाली विवरण प्रविष्ट गर्नुहोस्"
                    />
                  </div>
                </div>

                {/* Featured Image */}
                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Image</span>
                    <h4>Featured Image</h4>
                  </div>

                  <div className="form-group">
                    <label htmlFor="featured_image" className="form-label">
                      Featured Image URL
                    </label>
                    <div className="image-picker-row">
                      <input
                        type="text"
                        id="featured_image"
                        className="form-input"
                        value={formData.featured_image}
                        onChange={(e) => handleInputChange('featured_image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openGalleryModal('featured_image')}
                      >
                        Select from Gallery
                      </button>
                    </div>

                    {formData.featured_image && (
                      <div className="image-preview">
                        <img src={formData.featured_image} alt="Featured" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Contact</span>
                    <h4>Contact Information</h4>
                  </div>

                  <div className="grid grid-2">
                    <div className="form-group">
                      <label htmlFor="office_phone" className="form-label">Office Phone</label>
                      <input
                        type="text"
                        id="office_phone"
                        className="form-input"
                        value={formData.office_phone ?? ''}
                        onChange={(e) => handleInputChange('office_phone', e.target.value)}
                        placeholder="+977-1-XXXXXXX"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="office_email" className="form-label">Office Email</label>
                      <input
                        type="email"
                        id="office_email"
                        className="form-input"
                        value={formData.office_email ?? ''}
                        onChange={(e) => handleInputChange('office_email', e.target.value)}
                        placeholder="info@palika.gov.np"
                      />
                    </div>
                  </div>

                  <div className="grid grid-2">
                    <div className="form-group">
                      <label htmlFor="website" className="form-label">Website</label>
                      <input
                        type="url"
                        id="website"
                        className="form-input"
                        value={formData.website ?? ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://palika.gov.np"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="total_wards" className="form-label">Total Wards</label>
                      <input
                        type="number"
                        id="total_wards"
                        className="form-input"
                        value={formData.total_wards === 0 ? '' : (formData.total_wards || '')}
                        onChange={(e) => {
                          const val = e.target.value.trim()
                          handleInputChange('total_wards', val === '' ? 0 : parseInt(val, 10) || 0)
                        }}
                        min={0}
                        max={50}
                      />
                    </div>
                  </div>
                </div>

                {/* Demographics */}
                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Stats</span>
                    <h4>Demographics</h4>
                  </div>

                  <div className="grid grid-3">
                    <div className="form-group">
                      <label htmlFor="population" className="form-label">Population</label>
                      <input
                        type="number"
                        id="population"
                        className="form-input"
                        value={formData.demographics.population === 0 ? '' : (formData.demographics.population || '')}
                        onChange={(e) => {
                          const val = e.target.value.trim()
                          handleNestedChange('demographics', 'population', val === '' ? 0 : parseInt(val, 10) || 0)
                        }}
                        placeholder="0"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="area" className="form-label">Area (sq km)</label>
                      <input
                        type="number"
                        id="area"
                        className="form-input"
                        value={formData.demographics.area_sq_km === 0 ? '' : (formData.demographics.area_sq_km || '')}
                        onChange={(e) => {
                          const val = e.target.value.trim()
                          handleNestedChange('demographics', 'area_sq_km', val === '' ? 0 : parseFloat(val) || 0)
                        }}
                        placeholder="0"
                        step="0.01"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="established" className="form-label">Established Year</label>
                      <input
                        type="number"
                        id="established"
                        className="form-input"
                        value={formData.demographics.established_year === 0 ? '' : (formData.demographics.established_year || '')}
                        onChange={(e) => {
                          const val = e.target.value.trim()
                          handleNestedChange('demographics', 'established_year', val === '' ? 0 : parseInt(val, 10) || 0)
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- Tourism Tab ---- */}
            {activeTab === 'tourism' && (
              <div className="form-section fade-in">
                <div className="section-header">
                  <h3 className="section-title">Tourism Information</h3>
                  <p className="section-subtitle">Help visitors plan their trip</p>
                </div>

                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Visit</span>
                    <h4>Visitor Details</h4>
                  </div>

                  <div className="grid grid-2">
                    <div className="form-group">
                      <label htmlFor="best_time" className="form-label">Best Time to Visit</label>
                      <input
                        type="text"
                        id="best_time"
                        className="form-input"
                        value={formData.tourism_info.best_time_to_visit || ''}
                        onChange={(e) => handleNestedChange('tourism_info', 'best_time_to_visit', e.target.value)}
                        placeholder="e.g., October to November"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="currency" className="form-label">Currency</label>
                      <input
                        type="text"
                        id="currency"
                        className="form-input"
                        value={formData.tourism_info.currency || 'NPR'}
                        onChange={(e) => handleNestedChange('tourism_info', 'currency', e.target.value)}
                        placeholder="NPR"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="accessibility" className="form-label">Accessibility Information</label>
                    <textarea
                      id="accessibility"
                      className="form-textarea"
                      value={formData.tourism_info.accessibility || ''}
                      onChange={(e) => handleNestedChange('tourism_info', 'accessibility', e.target.value)}
                      placeholder="Describe accessibility features — roads, airports, public transport"
                      rows={3}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="languages" className="form-label">Languages (comma-separated)</label>
                    <input
                      type="text"
                      id="languages"
                      className="form-input"
                      value={formData.tourism_info.languages?.join(', ') || ''}
                      onChange={(e) => handleNestedChange('tourism_info', 'languages', e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
                      placeholder="e.g., English, Nepali, Chinese"
                    />
                  </div>
                </div>

                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Image</span>
                    <h4>Tourism Image</h4>
                  </div>

                  <div className="form-group">
                    <label htmlFor="tourism_image" className="form-label">Tourism Information Image</label>
                    <div className="image-picker-row">
                      <input
                        type="text"
                        id="tourism_image"
                        className="form-input"
                        value={formData.tourism_info.image_url || ''}
                        onChange={(e) => handleNestedChange('tourism_info', 'image_url', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => openGalleryModal('tourism_info')}
                      >
                        Select from Gallery
                      </button>
                    </div>

                    {formData.tourism_info.image_url && (
                      <div className="image-preview">
                        <img src={formData.tourism_info.image_url} alt="Tourism" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ---- Highlights & Gallery Tab ---- */}
            {activeTab === 'highlights' && (
              <div className="form-section fade-in">
                <div className="section-header">
                  <h3 className="section-title">Highlights & Gallery</h3>
                  <p className="section-subtitle">Notable attractions and image library</p>
                </div>

                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Highlights</span>
                    <h4>Palika Highlights</h4>
                  </div>

                  {formData.highlights.map((highlight, index) => (
                    <div key={index} className="repeater-card">
                      <div className="repeater-card-header">
                        <span className="repeater-card-title">Highlight #{index + 1}</span>
                        {formData.highlights.length > 1 && (
                          <button
                            type="button"
                            className="btn-danger-sm"
                            onClick={() => removeHighlight(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">Title</label>
                        <input
                          type="text"
                          className="form-input"
                          value={highlight.title}
                          onChange={(e) => handleHighlightChange(index, 'title', e.target.value)}
                          placeholder="e.g., Ancient Temple"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                          className="form-textarea"
                          value={highlight.description}
                          onChange={(e) => handleHighlightChange(index, 'description', e.target.value)}
                          placeholder="Describe this highlight"
                          rows={2}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Image</label>
                        <div className="image-picker-row">
                          <input
                            type="text"
                            className="form-input"
                            value={highlight.image_url || ''}
                            onChange={(e) => handleHighlightChange(index, 'image_url', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                          />
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => openGalleryModal(`highlight_${index}` as `highlight_${number}`)}
                          >
                            Select
                          </button>
                        </div>
                        {highlight.image_url && (
                          <div className="image-preview image-preview-sm">
                            <img src={highlight.image_url} alt={`Highlight ${index + 1}`} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button type="button" className="btn-add" onClick={addHighlight}>
                    + Add Highlight
                  </button>
                </div>

                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Gallery</span>
                    <h4>Image Library</h4>
                  </div>
                  <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
                    Uploaded images are synced to the public m-place site on save.
                  </p>

                  {palikaId && (
                    <AssetGallery palikaId={palikaId} />
                  )}
                </div>
              </div>
            )}

            {/* ---- Media Tab ---- */}
            {activeTab === 'media' && (
              <div className="form-section fade-in">
                <div className="section-header">
                  <h3 className="section-title">Media</h3>
                  <p className="section-subtitle">Featured YouTube videos</p>
                </div>

                <div className="form-card">
                  <div className="form-card-header">
                    <span className="form-card-icon-text">Videos</span>
                    <h4>YouTube Videos</h4>
                  </div>

                  {formData.videos.map((video, index) => (
                    <div key={index} className="repeater-card">
                      <div className="repeater-card-header">
                        <span className="repeater-card-title">Video #{index + 1}</span>
                        {formData.videos.length > 0 && (
                          <button
                            type="button"
                            className="btn-danger-sm"
                            onClick={() => removeVideo(index)}
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label">YouTube URL</label>
                        <input
                          type="text"
                          className="form-input"
                          value={video}
                          onChange={(e) => handleVideoChange(index, e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                        />
                      </div>

                      {video && getYouTubeEmbedUrl(video) ? (
                        <div className="video-preview">
                          <iframe
                            src={getYouTubeEmbedUrl(video) || ''}
                            title={`Video ${index + 1}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : video ? (
                        <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                          <span className="alert-icon">!</span>
                          <span>Invalid YouTube URL. Use https://youtube.com/watch?v=... or https://youtu.be/...</span>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  <button type="button" className="btn-add" onClick={addVideo}>
                    + Add Video
                  </button>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="form-actions">
              <div className="form-actions-left">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab(TABS[currentStepIndex - 1].id)}
                  >
                    ← Previous
                  </button>
                )}
              </div>
              <div className="form-actions-right">
                {!isLastStep ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setActiveTab(TABS[currentStepIndex + 1].id)}
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <span className="spinner" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        Save Palika Profile
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Gallery Modal */}
        {showGalleryModal && palikaId && (
          <div className="gallery-modal-overlay">
            <div className="gallery-modal">
              <div className="gallery-modal-header">
                <h2>Select Image from Gallery</h2>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowGalleryModal(false)
                    setSelectedImageField(null)
                  }}
                >
                  Close
                </button>
              </div>

              <AssetGallery
                palikaId={palikaId}
                selectMode={true}
                onAssetSelect={handleAssetSelect}
              />
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
