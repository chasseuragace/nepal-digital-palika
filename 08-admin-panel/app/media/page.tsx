'use client'

import AdminLayout from '@/components/AdminLayout'

export default function MediaPage() {
  return (
    <AdminLayout>
      <h1>Media Management</h1>
      
      <div className="card">
        <h3>Media Library</h3>
        <p>Media management functionality coming soon...</p>
        
        <div style={{ marginTop: '20px' }}>
          <button className="btn btn-primary" style={{ marginRight: '10px' }}>
            Upload Images
          </button>
          <button className="btn btn-secondary">
            Manage Gallery
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}