'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import PalikaGallery from '@/components/PalikaGallery'

interface GalleryItem {
  id: string
  file_name: string
  storage_path: string
}

interface PalikaProfile {
  id: string
  palika_id: number
  description_en: string
  description_ne: string
  featured_image: string
  gallery_images: string[]
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
}

interface FormData {
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
}

export default function PalikaProfilePage() {
  const [profile, setProfile] = useState<PalikaProfile | null>(null)
  const [palikaId, setPalikaId] = useState<number | null>(null)
  const [formData, setFormData] = useState<FormData>({
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
    videos: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [selectedImageField, setSelectedImageField] = useState<'featured_image' | `highlight_${number}` | 'tourism_info' | null>(null)

  useEffect(() => {
    fetchPalikaProfile()
  }, [])

  const fetchPalikaProfile = async () => {
    try {
      const adminSession = localStorage.getItem('adminSession')
      const admin = adminSession ? JSON.parse(adminSession) : null

      if (!admin?.palika_id) {
        setMessage({ type: 'error', text: 'No palika assigned to this admin' })
        setIsLoading(false)
        return
      }

      setPalikaId(admin.palika_id)

      const response = await fetch(`/api/palika-profile?palika_id=${admin.palika_id}`)
      const data = await response.json()

      if (response.ok && data.profile) {
        setProfile(data.profile)
        setFormData({
          description_en: data.profile.description_en || '',
          description_ne: data.profile.description_ne || '',
          featured_image: data.profile.featured_image || '',
          highlights: data.profile.highlights || [{ title: '', description: '' }],
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
          videos: data.profile.videos || []
        })
      }
    } catch (error) {
      console.error('Error fetching palika profile:', error)
      setMessage({ type: 'error', text: 'Failed to load palika profile' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => {
      const parentData = prev[parent as keyof FormData]
      if (typeof parentData === 'object' && parentData !== null) {
        return {
          ...prev,
          [parent]: {
            ...parentData,
            [field]: value
          }
        }
      }
      return prev
    })
  }

  const handleHighlightChange = (index: number, field: string, value: string) => {
    const newHighlights = [...formData.highlights]
    newHighlights[index] = { ...newHighlights[index], [field]: value }
    setFormData(prev => ({
      ...prev,
      highlights: newHighlights
    }))
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
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, '']
    }))
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
    setFormData(prev => ({
      ...prev,
      videos: newVideos
    }))
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

  const handleImageSelect = (item: GalleryItem) => {
    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`
    
    if (selectedImageField === 'featured_image') {
      setFormData(prev => ({
        ...prev,
        featured_image: publicUrl
      }))
    } else if (selectedImageField === 'tourism_info') {
      setFormData(prev => ({
        ...prev,
        tourism_info: {
          ...prev.tourism_info,
          image_url: publicUrl
        }
      }))
    } else if (selectedImageField?.startsWith('highlight_')) {
      const highlightIndex = parseInt(selectedImageField.split('_')[1])
      const newHighlights = [...formData.highlights]
      newHighlights[highlightIndex] = {
        ...newHighlights[highlightIndex],
        image_url: publicUrl
      }
      setFormData(prev => ({
        ...prev,
        highlights: newHighlights
      }))
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
      const adminSession = localStorage.getItem('adminSession')
      const admin = adminSession ? JSON.parse(adminSession) : null

      const response = await fetch('/api/palika-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Palika-ID': admin.palika_id.toString()
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Palika profile updated successfully!' })
        setProfile(data.profile)
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      console.error('Error saving palika profile:', error)
      setMessage({ type: 'error', text: 'Failed to save palika profile' })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div>Loading palika profile...</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1>Palika Profile Management</h1>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '4px',
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Descriptions */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Descriptions</h2>
          
          <div className="form-group">
            <label htmlFor="description_en">Description (English)</label>
            <textarea
              id="description_en"
              value={formData.description_en}
              onChange={(e) => handleInputChange('description_en', e.target.value)}
              rows={4}
              placeholder="Enter English description of the palika"
              style={{ width: '100%', padding: '10px', fontFamily: 'monospace' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description_ne">Description (Nepali)</label>
            <textarea
              id="description_ne"
              value={formData.description_ne}
              onChange={(e) => handleInputChange('description_ne', e.target.value)}
              rows={4}
              placeholder="पालिकाको नेपाली विवरण प्रविष्ट गर्नुहोस्"
              style={{ width: '100%', padding: '10px', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        {/* Featured Image */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Featured Image</h2>
          
          <div className="form-group">
            <label htmlFor="featured_image">Featured Image URL</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                id="featured_image"
                value={formData.featured_image}
                onChange={(e) => handleInputChange('featured_image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{ flex: 1, padding: '10px' }}
              />
              <button
                type="button"
                onClick={() => openGalleryModal('featured_image')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                📷 Select from Gallery
              </button>
            </div>
          </div>

          {formData.featured_image && (
            <div style={{ marginTop: '10px' }}>
              <img
                src={formData.featured_image}
                alt="Featured"
                style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '4px' }}
              />
            </div>
          )}
        </div>

        {/* Highlights */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Highlights</h2>
          
          {formData.highlights.map((highlight, index) => (
            <div key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <div className="form-group">
                <label>Highlight {index + 1} Title</label>
                <input
                  type="text"
                  value={highlight.title}
                  onChange={(e) => handleHighlightChange(index, 'title', e.target.value)}
                  placeholder="e.g., Ancient Temple"
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div className="form-group">
                <label>Highlight {index + 1} Description</label>
                <textarea
                  value={highlight.description}
                  onChange={(e) => handleHighlightChange(index, 'description', e.target.value)}
                  placeholder="Describe this highlight"
                  rows={2}
                  style={{ width: '100%', padding: '8px' }}
                />
              </div>

              <div className="form-group">
                <label>Highlight {index + 1} Image</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={highlight.image_url || ''}
                    onChange={(e) => handleHighlightChange(index, 'image_url', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    style={{ flex: 1, padding: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => openGalleryModal(`highlight_${index}` as `highlight_${number}`)}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      fontSize: '12px'
                    }}
                  >
                    📷 Select
                  </button>
                </div>
                {highlight.image_url && (
                  <img
                    src={highlight.image_url}
                    alt={`Highlight ${index + 1}`}
                    style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', marginBottom: '10px' }}
                  />
                )}
              </div>

              {formData.highlights.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHighlight(index)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove Highlight
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addHighlight}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Highlight
          </button>
        </div>

        {/* Tourism Info */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Tourism Information</h2>
          
          <div className="form-group">
            <label htmlFor="best_time">Best Time to Visit</label>
            <input
              type="text"
              id="best_time"
              value={formData.tourism_info.best_time_to_visit || ''}
              onChange={(e) => handleNestedChange('tourism_info', 'best_time_to_visit', e.target.value)}
              placeholder="e.g., October to November"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="accessibility">Accessibility Information</label>
            <textarea
              id="accessibility"
              value={formData.tourism_info.accessibility || ''}
              onChange={(e) => handleNestedChange('tourism_info', 'accessibility', e.target.value)}
              placeholder="Describe accessibility features"
              rows={3}
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="languages">Languages (comma-separated)</label>
            <input
              type="text"
              id="languages"
              value={formData.tourism_info.languages?.join(', ') || ''}
              onChange={(e) => handleNestedChange('tourism_info', 'languages', e.target.value.split(',').map(l => l.trim()))}
              placeholder="e.g., English, Nepali, Chinese"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <input
              type="text"
              id="currency"
              value={formData.tourism_info.currency || 'NPR'}
              onChange={(e) => handleNestedChange('tourism_info', 'currency', e.target.value)}
              placeholder="NPR"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="tourism_image">Tourism Information Image</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                id="tourism_image"
                value={formData.tourism_info.image_url || ''}
                onChange={(e) => handleNestedChange('tourism_info', 'image_url', e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{ flex: 1, padding: '10px' }}
              />
              <button
                type="button"
                onClick={() => openGalleryModal('tourism_info')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                📷 Select from Gallery
              </button>
            </div>
            {formData.tourism_info.image_url && (
              <img
                src={formData.tourism_info.image_url}
                alt="Tourism Info"
                style={{ maxWidth: '300px', maxHeight: '200px', borderRadius: '4px' }}
              />
            )}
          </div>
        </div>

        {/* Demographics */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>Demographics</h2>
          
          <div className="form-group">
            <label htmlFor="population">Population</label>
            <input
              type="number"
              id="population"
              value={formData.demographics.population || 0}
              onChange={(e) => handleNestedChange('demographics', 'population', parseInt(e.target.value))}
              placeholder="0"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">Area (sq km)</label>
            <input
              type="number"
              id="area"
              value={formData.demographics.area_sq_km || 0}
              onChange={(e) => handleNestedChange('demographics', 'area_sq_km', parseFloat(e.target.value))}
              placeholder="0"
              step="0.01"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="established">Established Year</label>
            <input
              type="number"
              id="established"
              value={formData.demographics.established_year || 0}
              onChange={(e) => handleNestedChange('demographics', 'established_year', parseInt(e.target.value))}
              placeholder="0"
              style={{ width: '100%', padding: '10px' }}
            />
          </div>
        </div>

        {/* Videos */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2>YouTube Videos</h2>
          
          {formData.videos.map((video, index) => (
            <div key={index} style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
              <div className="form-group">
                <label>Video {index + 1} URL</label>
                <input
                  type="text"
                  value={video}
                  onChange={(e) => handleVideoChange(index, e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />
              </div>

              {video && getYouTubeEmbedUrl(video) ? (
                <div style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Preview:</p>
                  <iframe
                    width="100%"
                    height="200"
                    src={getYouTubeEmbedUrl(video) || ''}
                    title={`Video ${index + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ borderRadius: '4px' }}
                  />
                </div>
              ) : video ? (
                <div style={{
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  color: '#856404',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  fontSize: '12px'
                }}>
                  ⚠️ Invalid YouTube URL. Please use: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID
                </div>
              ) : null}

              {formData.videos.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove Video
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addVideo}
            style={{
              padding: '10px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Video
          </button>
        </div>

        {/* Submit Button */}
        <div style={{ marginTop: '30px' }}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: '12px 30px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              opacity: isSaving ? 0.6 : 1
            }}
          >
            {isSaving ? 'Saving...' : 'Save Palika Profile'}
          </button>
        </div>
      </form>

      {/* Gallery Modal */}
      {showGalleryModal && palikaId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            padding: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Select Image from Gallery</h2>
              <button
                onClick={() => {
                  setShowGalleryModal(false)
                  setSelectedImageField(null)
                }}
                style={{
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
            
            <PalikaGallery 
              palikaId={palikaId}
              selectMode={true}
              onImageSelect={handleImageSelect}
            />
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
