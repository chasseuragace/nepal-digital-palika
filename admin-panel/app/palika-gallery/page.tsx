'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import PalikaGallery from '@/components/PalikaGallery'
import { adminSessionStore, type AdminSession } from '@/lib/storage/session-storage.service'
import './palika-gallery.css'

export default function PalikaGalleryPage() {
  const [admin, setAdmin] = useState<AdminSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = adminSessionStore.get()
    if (session) {
      setAdmin(session)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading gallery...</p>
        </div>
      </AdminLayout>
    )
  }

  if (!admin?.palika_id) {
    return (
      <AdminLayout>
        <div className="heritage-container">
          <div className="alert alert-error slide-in-up">
            <span className="alert-icon">✕</span>
            <span>No palika assigned to this admin</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="heritage-container">
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Palika Gallery</h1>
              <p className="page-subtitle">Upload and manage images for your palika profile</p>
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

        <div className="gallery-content-card">
          <PalikaGallery palikaId={admin.palika_id} />
        </div>
      </div>
    </AdminLayout>
  )
}
