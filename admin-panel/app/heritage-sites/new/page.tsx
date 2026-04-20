'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import HeritageSiteForm, {
  EMPTY_FORM_STATE
} from '../_components/HeritageSiteForm'
import { heritageSitesService } from '@/lib/client/heritage-sites-client.service'
import type { CreateHeritageSiteInput } from '@/services/types'
import './heritage-sites-new.css'

export default function NewHeritageSitePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (payload: CreateHeritageSiteInput) => {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // Client service is loosely typed (Partial<HeritageSite>); the payload
      // we hand in already matches the server-side CreateHeritageSiteInput
      // contract exactly. Cast to satisfy the client service signature.
      await heritageSitesService.create(payload as any)
      setSuccess('Heritage site created successfully!')
      setTimeout(() => {
        router.push('/heritage-sites')
      }, 1500)
    } catch (err) {
      console.error('Error creating heritage site:', err)
      setError(err instanceof Error ? err.message : 'Failed to create heritage site')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <HeritageSiteForm
        initialState={EMPTY_FORM_STATE}
        submitLabel="Create Heritage Site"
        loadingLabel="Creating Heritage Site..."
        isSubmitting={isSubmitting}
        error={error}
        success={success}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/heritage-sites')}
        heading="Create Heritage Site"
        subheading="Preserve history, share culture, inspire visitors"
      />
    </AdminLayout>
  )
}
