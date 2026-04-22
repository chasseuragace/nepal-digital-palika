'use client'

import { useEffect, useState } from 'react'

type FileType = 'image' | 'document'

interface Asset {
  id: string
  palika_id?: number
  file_type: FileType
  mime_type?: string
  file_size: number
  storage_path: string
  public_url: string
  display_name: string
  is_featured?: boolean
  sort_order?: number
  created_by: string
  created_at: string
  updated_at: string
}

interface AssetGalleryProps {
  palikaId?: number
  onAssetSelect?: (asset: Asset) => void
  selectMode?: boolean
  fileType?: FileType
  uploadEnabled?: boolean
}

export default function AssetGallery({
  palikaId,
  onAssetSelect,
  selectMode = false,
  fileType = undefined,
  uploadEnabled = true
}: AssetGalleryProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [activeTab, setActiveTab] = useState<FileType>('image')
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchAssets()
  }, [palikaId])

  const fetchAssets = async () => {
    try {
      const params = new URLSearchParams()
      
      // Add palika_id if provided
      if (palikaId) {
        params.append('palika_id', palikaId.toString())
      } else {
        // If no palikaId, fetch generic gallery
        params.append('generic_gallery', 'true')
      }
      
      // Add file_type filter if specified
      if (fileType) {
        params.append('file_type', fileType)
      }

      const response = await fetch(`/api/gallery?${params}`)
      const data = await response.json()
      if (response.ok) {
        setAssets(data.assets || [])
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
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
        formData.append('file_type', activeTab)
        formData.append('display_name', file.name)

        const response = await fetch('/api/gallery/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if (response.ok) {
          setAssets(prev => [...prev, data.asset])
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

    if (e.currentTarget) {
      e.currentTarget.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/gallery?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAssets(prev => prev.filter(item => item.id !== id))
        setMessage({ type: 'success', text: 'Asset deleted successfully' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Delete failed' })
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      setMessage({ type: 'error', text: 'Failed to delete asset' })
    }
  }

  const handleSetFeatured = async (id: string) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          is_featured: true
        })
      })

      if (response.ok) {
        setAssets(prev =>
          prev.map(item => ({
            ...item,
            is_featured: item.id === id
          }))
        )
        setMessage({ type: 'success', text: 'Featured image updated' })
      } else {
        const data = await response.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update featured image' })
      }
    } catch (error) {
      console.error('Error updating featured image:', error)
      setMessage({ type: 'error', text: 'Failed to update featured image' })
    }
  }


  const filteredAssets = assets.filter(item => !fileType || item.file_type === activeTab)

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

  // Determine gallery title based on props
  const getGalleryTitle = () => {
    if (palikaId) {
      return `Palika Gallery (ID: ${palikaId})`
    } else {
      return 'Generic Gallery'
    }
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2>{getGalleryTitle()}</h2>

      {message && (
        <div
          style={{
            padding: '15px',
            marginBottom: '20px',
            borderRadius: '4px',
            backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}
        >
          {message.text}
        </div>
      )}

      {/* Tabs */}
      {!fileType && (
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
            Images ({assets.filter(i => i.file_type === 'image').length})
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
            Documents ({assets.filter(i => i.file_type === 'document').length})
          </button>
        </div>
      )}

      {/* Upload Section */}
      {uploadEnabled && !selectMode && (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '4px',
            marginBottom: '20px',
            border: '2px dashed #ddd'
          }}
        >
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
      )}

      {/* Gallery Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '15px'
        }}
      >
        {filteredAssets.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>
            No {activeTab}s uploaded yet
          </p>
        ) : (
          filteredAssets.map(item => (
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
              onClick={() => selectMode && onAssetSelect && onAssetSelect(item)}
            >
              {/* Preview */}
              {item.file_type === 'image' ? (
                <img
                  src={item.public_url}
                  alt={item.display_name}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    backgroundColor: '#f0f0f0'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '150px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    fontSize: '40px'
                  }}
                >
                  📄
                </div>
              )}

              {/* Info */}
              <div style={{ padding: '10px' }}>
                <p
                  style={{
                    margin: '0 0 5px 0',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.display_name}
                </p>
                <p
                  style={{
                    margin: '0 0 10px 0',
                    fontSize: '11px',
                    color: '#666'
                  }}
                >
                  {formatFileSize(item.file_size)}
                </p>

                {/* Actions */}
                {!selectMode && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {activeTab === 'image' && (
                      <button
                        onClick={() => handleSetFeatured(item.id)}
                        style={{
                          flex: '1 1 100%',
                          padding: '5px',
                          fontSize: '11px',
                          backgroundColor: item.is_featured ? '#28a745' : '#e9ecef',
                          color: item.is_featured ? 'white' : 'black',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          marginBottom: '5px'
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
