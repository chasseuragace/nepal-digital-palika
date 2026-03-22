'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import PalikaGallery from '@/components/PalikaGallery'

interface AdminUser {
  id: string
  palika_id?: number
}

export default function PalikaGalleryPage() {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession')
    if (adminSession) {
      setAdmin(JSON.parse(adminSession))
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
