'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import HeritageSiteForm, {
  EMPTY_FORM_STATE,
  type FormState
} from '../_components/HeritageSiteForm'
import { heritageSitesService } from '@/lib/client/heritage-sites-client.service'
import type {
  CreateHeritageSiteInput,
  HeritageSite,
  HeritageWeekday
} from '@/services/types'
import '../new/heritage-sites-new.css'

// Reverse-hydrate an existing HeritageSite row into the FormState shape used
// by the shared form component.
function siteToFormState(site: HeritageSite): FormState {
  const weekdays: HeritageWeekday[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday'
  ]

  const opening_hours = { ...EMPTY_FORM_STATE.opening_hours }
  if (site.opening_hours) {
    for (const day of weekdays) {
      opening_hours[day] = (site.opening_hours as any)[day] || ''
    }
  }

  const fee = site.entry_fee
  const entry_fee = {
    local_adult: fee ? String(fee.local_adult ?? '') : '',
    local_child: fee ? String(fee.local_child ?? '') : '',
    foreign_adult: fee ? String(fee.foreign_adult ?? '') : '',
    foreign_child: fee ? String(fee.foreign_child ?? '') : '',
    currency: fee?.currency || 'NPR'
  }

  const access = site.accessibility_info
  const accessibility_info = {
    wheelchair_accessible: !!access?.wheelchair_accessible,
    parking: !!access?.parking,
    restrooms: !!access?.restrooms,
    guide_available: !!access?.guide_available
  }

  const langs = site.languages_available || []
  const languages_available = {
    en: langs.includes('en'),
    ne: langs.includes('ne')
  }

  return {
    name_en: site.name_en || '',
    name_ne: site.name_ne || '',
    category_id: site.category_id ? String(site.category_id) : '',
    site_type: site.site_type || '',
    heritage_status: site.heritage_status || '',
    status: site.status || 'draft',
    is_featured: !!site.is_featured,
    address: site.address || '',
    ward_number: site.ward_number ? String(site.ward_number) : '',
    palika_id: site.palika_id ? String(site.palika_id) : '',
    latitude: site.location ? String(site.location.lat) : '',
    longitude: site.location ? String(site.location.lng) : '',
    altitude: '',
    short_description: site.short_description || '',
    short_description_ne: site.short_description_ne || '',
    full_description: site.full_description || '',
    full_description_ne: site.full_description_ne || '',
    opening_hours,
    entry_fee,
    accessibility_info,
    best_time_to_visit: site.best_time_to_visit || '',
    average_visit_duration_minutes: site.average_visit_duration_minutes
      ? String(site.average_visit_duration_minutes)
      : '',
    audio_guide_url: site.audio_guide_url || '',
    languages_available,
    url_slug: site.slug || ''
  }
}

export default function EditHeritageSitePage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [initialState, setInitialState] = useState<FormState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!id) return
    ;(async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        // Client service is minimally typed; treat response as the canonical
        // HeritageSite shape from services/types.ts.
        const site = (await heritageSitesService.getById(id)) as unknown as HeritageSite
        setInitialState(siteToFormState(site))
      } catch (err) {
        console.error('Error fetching heritage site:', err)
        setLoadError(err instanceof Error ? err.message : 'Failed to load heritage site')
      } finally {
        setIsLoading(false)
      }
    })()
  }, [id])

  const handleSubmit = async (payload: CreateHeritageSiteInput) => {
    if (!id) return
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      await heritageSitesService.update(id, payload as any)
      setSuccess('Heritage site updated successfully!')
      setTimeout(() => {
        router.push('/heritage-sites')
      }, 1500)
    } catch (err) {
      console.error('Error updating heritage site:', err)
      setError(err instanceof Error ? err.message : 'Failed to update heritage site')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading heritage site...</p>
        </div>
      </AdminLayout>
    )
  }

  if (loadError || !initialState) {
    return (
      <AdminLayout>
        <div className="heritage-container">
          <div className="alert alert-error slide-in-up">
            <span className="alert-icon">✕</span>
            <span>{loadError || 'Heritage site not found'}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => router.push('/heritage-sites')}
            >
              ← Back to Sites
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <HeritageSiteForm
        initialState={initialState}
        submitLabel="Save Changes"
        loadingLabel="Saving Changes..."
        isSubmitting={isSubmitting}
        error={error}
        success={success}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/heritage-sites')}
        heading="Edit Heritage Site"
        subheading="Update details, refine the story, adjust visitor info"
      />
    </AdminLayout>
  )
}
