'use client'

import { useEffect, useState } from 'react'

interface GalleryItem {
  id: string
  palika_id: number
  file_name: string
  file_type: 'image' | 'document'
  mime_type: string
  file_size: number
  storage_path: string
  display_name: string
  description: string
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

interface PalikaGalleryProps {
  palikaId: number
  onImageSelect?: (item: GalleryItem) => void
  selectMode?: boolean
}

export default function PalikaGallery({ palikaId, onImageSelect, selectMode = false }: PalikaGalleryProps) {
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [activeTab, setActiveTab] = useState<'image' | 'document'>('image')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchGallery()
  }, [palikaId])

  const fetchGallery = async () => {
    try {
      const response = await fetch(`/api/palika-gallery?palika_id=${palikaId}`)
      const data = await response.json()
      if (response.ok) {
        setGallery(data.gallery || [])
      }
    } catch (error) {
      console.error('Error fetching gallery:', error)
      setMessage({ type: 'error', text: 'Failed to load gallery' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget?.files
    if (!files) return

    setIsUploading(true)
    setMessage(null)

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('palika_id', palikaId.toString())
        formData.append('file_type', activeTab)
        formData.append('display_name', file.name)

        const response = await fetch('/api/palika-gallery/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (response.ok) {
          setGallery(prev => [...prev, data.gallery_item])
          setMessage({ type: 'success', text: `${file.name} uploaded successfully` })
        } else {
          setMessage({ type: 'error', text: data.error || 'Upload failed' })
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        setMessage({ type: 'error', text: 'Failed to upload file' })
      }
    }

    setIsUploading(false)
    
    // Reset input safely
    if (e.currentTarget) {
      e.currentTarget.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/palika-gallery?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setGallery(prev => prev.filter(item => item.id !== id))
        setMessage({ type: 'success', text: 'Item deleted successfully' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Delete failed' })
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      setMessage({ type: 'error', text: 'Failed to delete item' })
    }
  }

  const handleSetFeatured = async (id: string) => {
    try {
      const response = await fetch('/api/palika-gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_featured: true
        })
      })

      if (response.ok) {
        setGallery(prev =>
          prev.map(item => ({
            ...item,
            is_featured: item.id === id
          }))
        )
        setMessage({ type: 'success', text: 'Featured image updated' })
      }
    } catch (error) {
      console.error('Error updating featured image:', error)
      setMessage({ type: 'error', text: 'Failed to update featured image' })
    }
  }

  const filteredGallery = gallery.filter(item => item.file_type === activeTab)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return <div>Loading gallery...</div>
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>Palika Gallery</h2>

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

      {/* Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => setActiveTab('image')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'image' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'image' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            marginRight: '10px',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Images ({gallery.filter(i => i.file_type === 'image').length})
        </button>
        <button
          onClick={() => setActiveTab('document')}
          style={{
            padding: '10px 20px',
            backgroundColor: activeTab === 'document' ? '#007bff' : '#f0f0f0',
            color: activeTab === 'document' ? 'white' : 'black',
            border: 'none',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0'
          }}
        >
          Documents ({gallery.filter(i => i.file_type === 'document').length})
        </button>
      </div>

      {/* Upload Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        marginBottom: '20px',
        border: '2px dashed #ddd'
      }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          Upload {activeTab === 'image' ? 'Images' : 'Documents'}
        </label>
        <input
          type="file"
          multiple
          accept={activeTab === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'application/pdf'}
          onChange={handleFileUpload}
          disabled={isUploading}
          style={{ marginBottom: '10px' }}
        />
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {activeTab === 'image'
            ? 'Supported formats: JPG, PNG, WebP, GIF (Max 50MB)'
            : 'Supported format: PDF (Max 50MB)'}
        </p>
      </div>

      {/* Gallery Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        {filteredGallery.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>
            No {activeTab}s uploaded yet
          </p>
        ) : (
          filteredGallery.map(item => (
            <div
              key={item.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden',
                backgroundColor: 'white',
                cursor: selectMode ? 'pointer' : 'default',
                opacity: selectMode ? 0.8 : 1,
                transition: 'all 0.2s'
              }}
              onClick={() => selectMode && onImageSelect && onImageSelect(item)}
            >
              {/* Preview */}
              {activeTab === 'image' ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${item.storage_path}`}
                  alt={item.display_name}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  fontSize: '40px'
                }}>
                  📄
                </div>
              )}

              {/* Info */}
              <div style={{ padding: '10px' }}>
                <p style={{
                  margin: '0 0 5px 0',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.display_name}
                </p>
                <p style={{
                  margin: '0 0 10px 0',
                  fontSize: '11px',
                  color: '#666'
                }}>
                  {formatFileSize(item.file_size)}
                </p>

                {/* Actions */}
                {!selectMode && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {activeTab === 'image' && (
                      <button
                        onClick={() => handleSetFeatured(item.id)}
                        style={{
                          flex: 1,
                          padding: '5px',
                          fontSize: '11px',
                          backgroundColor: item.is_featured ? '#28a745' : '#e9ecef',
                          color: item.is_featured ? 'white' : 'black',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer'
                        }}
                      >
                        {item.is_featured ? '⭐ Featured' : 'Set Featured'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{
                        flex: 1,
                        padding: '5px',
                        fontSize: '11px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
