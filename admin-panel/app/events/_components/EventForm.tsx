'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import AssetGallery from '@/components/AssetGallery'
import { categoriesService, type Category } from '@/lib/client/categories-client.service'
import { palikaService, type Palika } from '@/lib/client/palika-client.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'

// Leaflet references `window` at module-eval time. Even though this form is a
// `'use client'` component, Next.js still runs the module graph during the
// static-prerender pass of `next build`, which tries to evaluate Leaflet and
// crashes with `window is not defined`. Loading `LocationPicker` via
// `next/dynamic` with `ssr: false` keeps the Leaflet chunk client-only.
const LocationPicker = dynamic(
  () => import('@/components/LocationPicker').then((m) => m.LocationPicker),
  { ssr: false }
)

/**
 * Shape of the event form state.
 * Keys here are already aligned with the Supabase `events` table
 * (so there is no rename step in the submit handler beyond building
 * the create/update payload).
 *
 * Note: `is_festival` is no longer stored in state — it is derived from
 * the `mode` prop on <EventForm> ("event" vs "festival"). `event_type`
 * has been dropped from the UI entirely; `category_id` is the real
 * classification and the DB column stays null for new records.
 *
 * Note: `palika_id` is auto-assigned from the logged-in admin's session
 * and is not part of form state.
 */
export interface EventFormState {
  // Basic
  name_en: string
  name_ne: string
  category_id: string // select value is a string; we coerce to number on submit
  status: 'draft' | 'published' | 'archived'

  // Schedule
  start_date: string
  end_date: string
  nepali_calendar_date: string
  recurrence_pattern: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

  // Location
  venue_name: string
  latitude: string // keep as string in state so empty ≠ 0
  longitude: string

  // Descriptions
  short_description: string
  short_description_ne: string
  full_description: string
  full_description_ne: string

  // Media
  featured_image: string
}

export const EMPTY_EVENT_FORM: EventFormState = {
  name_en: '',
  name_ne: '',
  category_id: '',
  status: 'draft',
  start_date: '',
  end_date: '',
  nepali_calendar_date: '',
  recurrence_pattern: 'none',
  venue_name: '',
  latitude: '',
  longitude: '',
  short_description: '',
  short_description_ne: '',
  full_description: '',
  full_description_ne: '',
  featured_image: ''
}

export type EventFormMode = 'event' | 'festival'

/**
 * Payload shipped to POST /api/events and PUT /api/events/[id].
 * Matches `CreateEventInput` in services/types.ts (plus `id` for PUT).
 */
export interface EventSubmitPayload {
  name_en: string
  name_ne: string
  palika_id: number
  category_id?: number
  event_type?: string
  is_festival: boolean
  nepali_calendar_date?: string
  recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  start_date: string
  end_date: string
  venue_name?: string
  latitude?: number
  longitude?: number
  short_description?: string
  short_description_ne?: string
  full_description?: string
  full_description_ne?: string
  featured_image?: string
  status: 'draft' | 'published' | 'archived'
}

/**
 * Convert raw form state to a server-ready payload.
 *
 * `mode` drives `is_festival` — the form no longer asks the user.
 * `event_type` is intentionally omitted: the DB column stays null, and
 * `category_id` is the canonical classification going forward.
 *
 * `palika_id` is auto-assigned from the logged-in admin's session.
 */
export function buildEventPayload(
  form: EventFormState,
  mode: EventFormMode,
  palikaId: number
): EventSubmitPayload {
  const toNum = (s: string): number | undefined => {
    if (s === '' || s === null || s === undefined) return undefined
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : undefined
  }
  const toInt = (s: string): number | undefined => {
    if (s === '' || s === null || s === undefined) return undefined
    const n = parseInt(s, 10)
    return Number.isFinite(n) ? n : undefined
  }

  return {
    name_en: form.name_en.trim(),
    name_ne: form.name_ne.trim(),
    palika_id: palikaId,
    category_id: toInt(form.category_id),
    // event_type deliberately omitted — column stays null for new records.
    event_type: undefined,
    is_festival: mode === 'festival',
    nepali_calendar_date: form.nepali_calendar_date || undefined,
    recurrence_pattern: form.recurrence_pattern,
    start_date: form.start_date,
    end_date: form.end_date,
    venue_name: form.venue_name || undefined,
    latitude: toNum(form.latitude),
    longitude: toNum(form.longitude),
    short_description: form.short_description || undefined,
    short_description_ne: form.short_description_ne || undefined,
    full_description: form.full_description || undefined,
    full_description_ne: form.full_description_ne || undefined,
    featured_image: form.featured_image || undefined,
    status: form.status
  }
}

interface EventFormProps {
  /**
   * CRUD intent — drives submit button copy.
   */
  formMode: 'create' | 'edit'
  /**
   * Event ID for gallery integration (edit mode only).
   */
  eventId?: string
  /**
   * Classification — drives `is_festival` on the submitted payload and
   * tweaks copy (e.g. "Create Event" vs "Create Festival"). The dedicated
   * `/events/*` and `/festivals/*` routes each pin this to a single value,
   * so palika admins never see an ambiguous checkbox.
   */
  mode: EventFormMode
  value: EventFormState
  onChange: (next: EventFormState) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isSubmitting: boolean
  error?: string
  success?: string
}

const TABS = [
  { id: 'basic', label: 'Basic Information', icon: '1', description: 'Name, type & category' },
  { id: 'schedule', label: 'Schedule & Location', icon: '2', description: 'Dates, venue & map' },
  { id: 'description', label: 'Description', icon: '3', description: 'English & Nepali copy' },
  { id: 'media', label: 'Media', icon: '4', description: 'Featured image' }
] as const

type TabId = typeof TABS[number]['id']

export default function EventForm({
  formMode,
  eventId,
  mode,
  value,
  onChange,
  onSubmit,
  onCancel,
  isSubmitting,
  error,
  success
}: EventFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>('basic')
  const [categories, setCategories] = useState<Category[]>([])
  const [palika, setPalika] = useState<Palika | null>(null)

  useEffect(() => {
    categoriesService
      .getByEntityType('event')
      .then(setCategories)
      .catch((err) => {
        console.error('Error fetching categories:', err)
        setCategories([])
      })

    // Fetch palika data for map center
    const session = adminSessionStore.get()
    if (session?.palika_id) {
      palikaService
        .getById(session.palika_id)
        .then(setPalika)
        .catch((err) => {
          console.error('Error fetching palika:', err)
        })
    }
  }, [])

  const setField = <K extends keyof EventFormState>(key: K, v: EventFormState[K]) => {
    onChange({ ...value, [key]: v })
  }

  const currentIndex = TABS.findIndex((t) => t.id === activeTab)
  const progress = ((currentIndex + 1) / TABS.length) * 100
  const isLastTab = currentIndex === TABS.length - 1

  const noun = mode === 'festival' ? 'Festival' : 'Event'
  const submitButtonLabel = formMode === 'create' ? `Create ${noun}` : `Update ${noun}`
  const submittingLabel = formMode === 'create' ? 'Creating...' : 'Saving...'

  return (
    <>
      {error && (
        <div className="alert alert-error slide-in-up">
          <span className="alert-icon">✕</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success slide-in-up">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      <div className="heritage-form-container">
        <div className="progress-section">
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="progress-text">
            Step {currentIndex + 1} of {TABS.length}
          </div>
        </div>

        <div className="tabs-container">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${
                index < currentIndex ? 'completed' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="tab-icon">{tab.icon}</div>
              <div className="tab-content">
                <div className="tab-label">{tab.label}</div>
                <div className="tab-description">{tab.description}</div>
              </div>
              {index < currentIndex && <div className="tab-check">✓</div>}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="heritage-form">
          {activeTab === 'basic' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Basic Information</h3>
                <p className="section-subtitle">Name, category, and status</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Names</span>
                  <h4>{noun} Names</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="name_ne" className="form-label">
                      {noun} Name (Nepali) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name_ne"
                      className="form-input"
                      value={value.name_ne}
                      onChange={(e) => setField('name_ne', e.target.value)}
                      required
                      placeholder="दशैँ महोत्सव"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="name_en" className="form-label">
                      {noun} Name (English) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name_en"
                      className="form-input"
                      value={value.name_en}
                      onChange={(e) => setField('name_en', e.target.value)}
                      required
                      placeholder="Dashain Festival"
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Category</span>
                  <h4>Category & Status</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="category_id" className="form-label">
                      Category
                    </label>
                    <select
                      id="category_id"
                      className="form-select"
                      value={value.category_id}
                      onChange={(e) => setField('category_id', e.target.value)}
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <div className="help-text">
                      {mode === 'festival'
                        ? 'Group this festival under a category (e.g. Religious, Cultural).'
                        : 'Group this event under a category (e.g. Sports, Workshop).'}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status" className="form-label">
                      Status <span className="required">*</span>
                    </label>
                    <select
                      id="status"
                      className="form-select"
                      value={value.status}
                      onChange={(e) =>
                        setField('status', e.target.value as EventFormState['status'])
                      }
                      required
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Schedule & Location</h3>
                <p className="section-subtitle">When and where the event takes place</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Dates</span>
                  <h4>Event Schedule</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="start_date" className="form-label">
                      Start Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="start_date"
                      className="form-input"
                      value={value.start_date}
                      onChange={(e) => setField('start_date', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_date" className="form-label">
                      End Date <span className="required">*</span>
                    </label>
                    <input
                      type="date"
                      id="end_date"
                      className="form-input"
                      value={value.end_date}
                      onChange={(e) => setField('end_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="nepali_calendar_date" className="form-label">
                      Nepali Calendar Date
                    </label>
                    <input
                      type="text"
                      id="nepali_calendar_date"
                      className="form-input"
                      value={value.nepali_calendar_date}
                      onChange={(e) => setField('nepali_calendar_date', e.target.value)}
                      placeholder="२०८२/०१/०१"
                    />
                    <div className="help-text">Bikram Sambat date, shown on the m-place.</div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="recurrence_pattern" className="form-label">
                      Recurrence
                    </label>
                    <select
                      id="recurrence_pattern"
                      className="form-select"
                      value={value.recurrence_pattern}
                      onChange={(e) =>
                        setField(
                          'recurrence_pattern',
                          e.target.value as EventFormState['recurrence_pattern']
                        )
                      }
                    >
                      <option value="none">None (one-off)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Location</span>
                  <h4>Venue & Map</h4>
                </div>

                <div className="form-group">
                  <label htmlFor="venue_name" className="form-label">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    id="venue_name"
                    className="form-input"
                    value={value.venue_name}
                    onChange={(e) => setField('venue_name', e.target.value)}
                    placeholder="Basantapur Durbar Square"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Location on Map
                  </label>
                  <LocationPicker
                    value={
                      value.latitude && value.longitude
                        ? { latitude: parseFloat(value.latitude), longitude: parseFloat(value.longitude) }
                        : null
                    }
                    onChange={(location) => {
                      // Update both fields in a single onChange call to avoid race condition
                      onChange({
                        ...value,
                        latitude: location.latitude.toString(),
                        longitude: location.longitude.toString()
                      })
                    }}
                    defaultCenter={palika?.center_point || null}
                  />
                  <div className="help-text">
                    Click on the map or use GPS to pin the event location
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'description' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Description & Story</h3>
                <p className="section-subtitle">Bilingual copy for listings and detail pages</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Summary</span>
                  <h4>Short Description</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="short_description" className="form-label">
                      Short Description (English)
                    </label>
                    <textarea
                      id="short_description"
                      className="form-textarea"
                      value={value.short_description}
                      onChange={(e) => setField('short_description', e.target.value)}
                      placeholder="Brief overview for listings and previews."
                      rows={4}
                    />
                    <div className="help-text">
                      <span className="char-count">
                        {value.short_description.length} characters
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="short_description_ne" className="form-label">
                      Short Description (Nepali)
                    </label>
                    <textarea
                      id="short_description_ne"
                      className="form-textarea"
                      value={value.short_description_ne}
                      onChange={(e) => setField('short_description_ne', e.target.value)}
                      placeholder="लिस्टिङको लागि छोटो विवरण"
                      rows={4}
                    />
                    <div className="help-text">
                      <span className="char-count">
                        {value.short_description_ne.length} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Details</span>
                  <h4>Full Description</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="full_description" className="form-label">
                      Full Description (English)
                    </label>
                    <textarea
                      id="full_description"
                      className="form-textarea"
                      value={value.full_description}
                      onChange={(e) => setField('full_description', e.target.value)}
                      placeholder="Background, cultural significance, activities, schedule..."
                      rows={10}
                    />
                    <div className="help-text">
                      <span className="char-count">
                        {value.full_description.length} characters
                      </span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="full_description_ne" className="form-label">
                      Full Description (Nepali)
                    </label>
                    <textarea
                      id="full_description_ne"
                      className="form-textarea"
                      value={value.full_description_ne}
                      onChange={(e) => setField('full_description_ne', e.target.value)}
                      placeholder="पृष्ठभूमि, सांस्कृतिक महत्त्व, क्रियाकलापहरू..."
                      rows={10}
                    />
                    <div className="help-text">
                      <span className="char-count">
                        {value.full_description_ne.length} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Media</h3>
                <p className="section-subtitle">Featured image for cards and detail pages</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Image</span>
                  <h4>Featured Image</h4>
                </div>
                <div className="form-group">
                  <label className="form-label">Featured Image</label>

                  {eventId && formMode === 'edit' ? (
                    <AssetGallery
                      entityType="event"
                      entityId={parseInt(eventId, 10)}
                      selectMode={true}
                      fileType="image"
                      uploadEnabled={true}
                      onAssetSelect={(asset) => {
                        const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/palika-gallery/${asset.storage_path}`
                        setField('featured_image', imageUrl)
                      }}
                    />
                  ) : (
                    <>
                      <input
                        type="url"
                        id="featured_image"
                        className="form-input"
                        value={value.featured_image}
                        onChange={(e) => setField('featured_image', e.target.value)}
                        placeholder="https://example.com/event-cover.jpg"
                      />
                      <div className="help-text">
                        Paste a public image URL. Create the event first to enable gallery upload.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="form-actions-left">
              {currentIndex > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(TABS[currentIndex - 1].id)}
                >
                  ← Previous
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>

            <div className="form-actions-right">
              {!isLastTab ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(TABS[currentIndex + 1].id)}
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn btn-primary btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner"></span>
                      {submittingLabel}
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      {submitButtonLabel}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </>
  )
}
