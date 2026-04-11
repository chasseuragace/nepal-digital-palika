'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import PalikaGallery from '@/components/PalikaGallery'
import { adminSessionStore, type AdminSession } from '@/lib/storage/session-storage.service'

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
        <div>Loading...</div>
      </AdminLayout>
    )
  }

  if (!admin?.palika_id) {
    return (
      <AdminLayout>
        <div style={{ color: 'red' }}>No palika assigned to this admin</div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <h1>Palika Gallery Manager</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Upload and manage images and documents for your palika profile
      </p>
      <PalikaGallery palikaId={admin.palika_id} />
    </AdminLayout>
  )
}
