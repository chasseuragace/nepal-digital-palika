'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import EventForm, {
  EMPTY_EVENT_FORM,
  buildEventPayload,
  type EventFormState
} from '../../events/_components/EventForm'
import { eventsService } from '@/lib/client/events-client.service'
import '../../events/new/events-new.css'

/**
 * Festival creation page. Shares the same EventForm component as
 * /events/new — only the `mode="festival"` prop differs, which flips
 * `is_festival=true` on the submitted payload and swaps copy.
 */
export default function NewFestivalPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<EventFormState>(EMPTY_EVENT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = buildEventPayload(formData, 'festival')

      if (!payload.palika_id) {
        setError('Palika is required')
        setIsSubmitting(false)
        return
      }

      await eventsService.create(payload as any)
      setSuccess('Festival created successfully!')
      setTimeout(() => router.push('/festivals'), 1500)
    } catch (err) {
      console.error('Error creating festival:', err)
      setError(err instanceof Error ? err.message : 'Failed to create festival')
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
              <h1 className="page-title">Create Festival</h1>
              <p className="page-subtitle">Showcase your palika&apos;s festivals and celebrations</p>
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

        <EventForm
          formMode="create"
          mode="festival"
          value={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/festivals')}
          isSubmitting={isSubmitting}
          error={error}
          success={success}
        />
      </div>
    </AdminLayout>
  )
}
