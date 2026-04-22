'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import EventForm, {
  EMPTY_EVENT_FORM,
  buildEventPayload,
  type EventFormState
} from '../../events/_components/EventForm'
import { hydrateEventForm } from '../../events/_components/hydrate-event-form'
import { eventsService } from '@/lib/client/events-client.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import '../../events/new/events-new.css'

/**
 * Festival edit page. Shares the same EventForm component as
 * /events/[id] — only the `mode="festival"` prop and the redirect
 * target differ. `is_festival=true` is derived from the mode prop,
 * so there is no UI checkbox.
 */
export default function EditFestivalPage() {
  const router = useRouter()
  const params = useParams()
  const festivalId = params.id as string

  const [formData, setFormData] = useState<EventFormState>(EMPTY_EVENT_FORM)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    eventsService
      .getById(festivalId)
      .then((data) => {
        if (cancelled) return
        setFormData(hydrateEventForm(data as any))
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error fetching festival:', err)
        setError('Error loading festival')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [festivalId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const session = adminSessionStore.get()
      if (!session?.palika_id) {
        setError('Unable to determine your palika. Please contact support.')
        setIsSubmitting(false)
        return
      }

      const payload = buildEventPayload(formData, 'festival', session.palika_id)

      await eventsService.update(festivalId, payload as any)
      setSuccess('Festival updated successfully!')
      setTimeout(() => router.push('/festivals'), 1500)
    } catch (err) {
      console.error('Error updating festival:', err)
      setError(err instanceof Error ? err.message : 'Failed to update festival')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="events-container">
        <div className="heritage-page-header">
          <div className="header-content">
            <div className="header-icon-box">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <h1 className="page-title">Edit Festival</h1>
              <p className="page-subtitle">
                {formData.name_en || formData.name_ne || 'Loading festival...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary header-cancel-btn"
            onClick={() => router.push('/festivals')}
          >
            ← Back to Festivals
          </button>
        </div>

        {isLoading ? (
          <div className="heritage-form-container" style={{ textAlign: 'center', padding: '48px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading festival...</p>
          </div>
        ) : (
          <EventForm
            formMode="edit"
            eventId={festivalId}
            mode="festival"
            value={formData}
            onChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/festivals')}
            isSubmitting={isSubmitting}
            error={error}
            success={success}
          />
        )}
      </div>
    </AdminLayout>
  )
}
