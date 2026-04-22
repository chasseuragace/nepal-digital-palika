'use client'

/**
 * Shared Heritage Site Form
 * Used by both /heritage-sites/new and /heritage-sites/[id]
 *
 * Submits a payload matching CreateHeritageSiteInput from services/types.ts
 * exactly — bilingual descriptions, DB enum statuses, structured JSONB
 * fields for opening_hours/entry_fee/accessibility_info, integer category_id
 * binding, and the new is_featured / audio_guide_url / languages_available
 * fields.
 *
 * TODO (deferred): wire featured_image + images[] to Supabase Storage upload.
 * See session-20-april/01-heritage-sites-alignment.md step 6.
 */

import { useEffect, useState } from 'react'
import AssetGallery from '@/components/AssetGallery'
import { categoriesService, type Category } from '@/lib/client/categories-client.service'
import { palikaService, type Palika } from '@/lib/client/palika-client.service'
import { adminSessionStore } from '@/lib/storage/session-storage.service'
import type {
  CreateHeritageSiteInput,
  HeritageStatus,
  HeritageSiteStatus,
  HeritageWeekday,
  OpeningHours,
  EntryFee,
  AccessibilityInfo
} from '@/services/types'

// ---------------------------------------------------------------------------
// Form-local state shape
// ---------------------------------------------------------------------------
// We keep the shape very close to CreateHeritageSiteInput, but:
// - latitude/longitude/ward_number/altitude are kept as strings so the user
//   can type freely. They are coerced to numbers (or undefined) at submit.
// - entry_fee's number fields are likewise strings in the form.
// - url_slug is computed client-side for preview only; the datasource also
//   generates a slug from name_en, but we show it here for the user.
// ---------------------------------------------------------------------------

const WEEKDAYS: HeritageWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
]

const HERITAGE_STATUS_OPTIONS: { value: HeritageStatus; label: string }[] = [
  { value: 'world_heritage', label: 'World Heritage' },
  { value: 'national', label: 'National' },
  { value: 'provincial', label: 'Provincial' },
  { value: 'local', label: 'Local' },
  { value: 'proposed', label: 'Proposed' }
]

const STATUS_OPTIONS: { value: HeritageSiteStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
]

export interface FormState {
  // Basic Info
  name_en: string
  name_ne: string
  category_id: string // bound to <option value>, coerced to number on submit
  site_type: string
  heritage_status: HeritageStatus | ''
  status: HeritageSiteStatus
  is_featured: boolean

  // Location
  address: string
  ward_number: string
  palika_id: string
  latitude: string
  longitude: string
  altitude: string // not persisted — UI only

  // Description
  short_description: string
  short_description_ne: string
  full_description: string
  full_description_ne: string

  // Visitor Information
  opening_hours: OpeningHours
  entry_fee: {
    local_adult: string
    local_child: string
    foreign_adult: string
    foreign_child: string
    currency: string
  }
  accessibility_info: AccessibilityInfo
  best_time_to_visit: string
  average_visit_duration_minutes: string
  audio_guide_url: string
  languages_available: { en: boolean; ne: boolean }

  // Media
  featured_image: string
  images: string[]

  // URL preview (not sent — datasource derives slug from name_en)
  url_slug: string
}

export const EMPTY_FORM_STATE: FormState = {
  name_en: '',
  name_ne: '',
  category_id: '',
  site_type: '',
  heritage_status: '',
  status: 'draft',
  is_featured: false,
  address: '',
  ward_number: '1',
  palika_id: '',
  latitude: '',
  longitude: '',
  altitude: '',
  short_description: '',
  short_description_ne: '',
  full_description: '',
  full_description_ne: '',
  opening_hours: {
    monday: '',
    tuesday: '',
    wednesday: '',
    thursday: '',
    friday: '',
    saturday: '',
    sunday: ''
  },
  entry_fee: {
    local_adult: '',
    local_child: '',
    foreign_adult: '',
    foreign_child: '',
    currency: 'NPR'
  },
  accessibility_info: {
    wheelchair_accessible: false,
    parking: false,
    restrooms: false,
    guide_available: false
  },
  best_time_to_visit: '',
  average_visit_duration_minutes: '',
  audio_guide_url: '',
  languages_available: { en: true, ne: true },
  featured_image: '',
  images: [],
  url_slug: ''
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Build the CreateHeritageSiteInput payload from the form state.
 * Applies number coercion and strips empty-string optionals.
 */
export function buildHeritagePayload(state: FormState): CreateHeritageSiteInput {
  const toInt = (v: string) => (v === '' ? undefined : parseInt(v, 10))
  const toFloat = (v: string) => (v === '' ? undefined : parseFloat(v))

  // Drop empty opening-hours days so we don't persist empty strings.
  const openingHoursEntries = (Object.entries(state.opening_hours) as [
    HeritageWeekday,
    string
  ][]).filter(([, v]) => v.trim() !== '')
  const opening_hours: OpeningHours | undefined =
    openingHoursEntries.length > 0
      ? (Object.fromEntries(openingHoursEntries) as OpeningHours)
      : undefined

  const fee = state.entry_fee
  const hasAnyFee =
    fee.local_adult !== '' ||
    fee.local_child !== '' ||
    fee.foreign_adult !== '' ||
    fee.foreign_child !== ''
  const entry_fee: EntryFee | undefined = hasAnyFee
    ? {
        local_adult: parseFloat(fee.local_adult || '0') || 0,
        local_child: parseFloat(fee.local_child || '0') || 0,
        foreign_adult: parseFloat(fee.foreign_adult || '0') || 0,
        foreign_child: parseFloat(fee.foreign_child || '0') || 0,
        currency: fee.currency || 'NPR'
      }
    : undefined

  const languages_available: string[] = []
  if (state.languages_available.en) languages_available.push('en')
  if (state.languages_available.ne) languages_available.push('ne')

  const payload: CreateHeritageSiteInput = {
    name_en: state.name_en.trim(),
    name_ne: state.name_ne.trim(),
    palika_id: parseInt(state.palika_id, 10),
    category_id: parseInt(state.category_id, 10),
    site_type: state.site_type || undefined,
    heritage_status: state.heritage_status || undefined,
    ward_number: toInt(state.ward_number),
    address: state.address || undefined,
    latitude: toFloat(state.latitude),
    longitude: toFloat(state.longitude),
    short_description: state.short_description || undefined,
    short_description_ne: state.short_description_ne || undefined,
    full_description: state.full_description || undefined,
    full_description_ne: state.full_description_ne || undefined,
    opening_hours,
    entry_fee,
    accessibility_info: state.accessibility_info,
    audio_guide_url: state.audio_guide_url || undefined,
    languages_available: languages_available.length > 0 ? languages_available : undefined,
    best_time_to_visit: state.best_time_to_visit || undefined,
    average_visit_duration_minutes: toInt(state.average_visit_duration_minutes),
    status: state.status,
    is_featured: state.is_featured,
    featured_image: state.featured_image || undefined,
    images: state.images.length > 0 ? state.images : undefined
  }

  return payload
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface HeritageSiteFormProps {
  siteId?: string
  initialState: FormState
  submitLabel: string
  loadingLabel: string
  isSubmitting: boolean
  error: string
  success: string
  onSubmit: (payload: CreateHeritageSiteInput) => Promise<void> | void
  onCancel: () => void
  heading: string
  subheading: string
}

export default function HeritageSiteForm({
  siteId,
  initialState,
  submitLabel,
  loadingLabel,
  isSubmitting,
  error,
  success,
  onSubmit,
  onCancel,
  heading,
  subheading
}: HeritageSiteFormProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState<FormState>(initialState)
  const [categories, setCategories] = useState<Category[]>([])
  const [palikas, setPalikas] = useState<Palika[]>([])

  // If the parent hands us a new initial state (edit page loads late), sync it.
  useEffect(() => {
    setFormData(initialState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialState])

  useEffect(() => {
    ;(async () => {
      try {
        const data = await categoriesService.getByEntityType('heritage_site')
        setCategories(data)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setCategories([])
      }
    })()
    ;(async () => {
      try {
        const data = await palikaService.getPalikas()
        setPalikas(data)
      } catch (err) {
        console.error('Error fetching palikas:', err)
        setPalikas([])
      }
    })()
  }, [])

  // Auto-inject palika_id from the logged-in admin's session (one-shot on mount)
  useEffect(() => {
    if (formData.palika_id) return // Don't override if already set (edit mode)
    const session = adminSessionStore.get()
    if (session?.palika_id) {
      setFormData(prev => ({
        ...prev,
        palika_id: session.palika_id!.toString()
      }))
    }
  }, [])

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'name_en' && typeof value === 'string') {
        next.url_slug = generateSlug(value)
      }
      return next
    })
  }

  const updateOpeningHour = (day: HeritageWeekday, value: string) => {
    setFormData(prev => ({
      ...prev,
      opening_hours: { ...prev.opening_hours, [day]: value }
    }))
  }

  const updateEntryFee = (field: keyof FormState['entry_fee'], value: string) => {
    setFormData(prev => ({
      ...prev,
      entry_fee: { ...prev.entry_fee, [field]: value }
    }))
  }

  const updateAccessibility = (field: keyof AccessibilityInfo, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      accessibility_info: { ...prev.accessibility_info, [field]: value }
    }))
  }

  const updateLanguage = (lang: 'en' | 'ne', value: boolean) => {
    setFormData(prev => ({
      ...prev,
      languages_available: { ...prev.languages_available, [lang]: value }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = buildHeritagePayload(formData)
    // Dev visibility: allow a human to inspect the exact shape being sent.
    // Safe to leave in — parent wraps network I/O and error handling.
    // eslint-disable-next-line no-console
    console.log('[HeritageSiteForm] submit payload =', payload)
    await onSubmit(payload)
  }

  const tabs = [
    { id: 'basic', label: 'Basic Information', icon: '1', description: 'Name, category & location' },
    { id: 'description', label: 'Description', icon: '2', description: 'Tell the story' },
    { id: 'visitor', label: 'Visitor Info', icon: '3', description: 'Hours, fees & access' },
    { id: 'media', label: 'Media', icon: '4', description: 'Photos & gallery' }
  ]
  const getCurrentStepIndex = () => tabs.findIndex(tab => tab.id === activeTab)
  const progress = ((getCurrentStepIndex() + 1) / tabs.length) * 100

  return (
    <div className="heritage-container">
      <div className="heritage-page-header">
        <div className="header-content">
          <div className="header-icon-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
              <path d="M4 22h16"></path>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
            </svg>
          </div>
          <div>
            <h1 className="page-title">{heading}</h1>
            <p className="page-subtitle">{subheading}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-secondary header-cancel-btn"
          onClick={onCancel}
        >
          ← Back to Sites
        </button>
      </div>

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
        <form onSubmit={handleSubmit}>
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">
              Step {getCurrentStepIndex() + 1} of {tabs.length}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="tabs-container">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                type="button"
                className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${index < getCurrentStepIndex() ? 'completed' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <div className="tab-icon">{tab.icon}</div>
                <div className="tab-content">
                  <div className="tab-label">{tab.label}</div>
                  <div className="tab-description">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* ============ TAB 1: BASIC INFORMATION ============ */}
          {activeTab === 'basic' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Basic Information</h3>
                <p className="section-subtitle">Name, category & location</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Name</span>
                  <h4>Site Name</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="name_ne" className="form-label">
                      Site Name (Nepali) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name_ne"
                      className="form-input"
                      value={formData.name_ne}
                      onChange={(e) => update('name_ne', e.target.value)}
                      required
                      placeholder="श्री स्वयम्भू महाचैत्य"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="name_en" className="form-label">
                      Site Name (English) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name_en"
                      className="form-input"
                      value={formData.name_en}
                      onChange={(e) => update('name_en', e.target.value)}
                      required
                      placeholder="Swayambhunath Stupa"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="url_slug" className="form-label">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    id="url_slug"
                    className="form-input"
                    value={formData.url_slug}
                    onChange={(e) => update('url_slug', e.target.value)}
                    placeholder="swayambhunath-stupa"
                  />
                  <div className="help-text">
                    <span>Auto-generated from English name (server may override).</span>
                    {formData.url_slug && (
                      <span className="url-preview">Preview: /heritage-sites/{formData.url_slug}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Category</span>
                  <h4>Classification</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="category_id" className="form-label">
                      Category <span className="required">*</span>
                    </label>
                    <select
                      id="category_id"
                      className="form-select"
                      value={formData.category_id}
                      onChange={(e) => update('category_id', e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => {
                        // Category from API uses name_en; client service may
                        // surface either name or name_en. Accept whatever is
                        // present.
                        const label = (cat as any).name_en || (cat as any).name || `Category ${cat.id}`
                        return (
                          <option key={String(cat.id)} value={String(cat.id)}>
                            {label}
                          </option>
                        )
                      })}
                    </select>
                    <div className="help-text">
                      <span>Sends integer <code>category_id</code> to the database.</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="site_type" className="form-label">
                      Type
                    </label>
                    <select
                      id="site_type"
                      className="form-select"
                      value={formData.site_type}
                      onChange={(e) => update('site_type', e.target.value)}
                    >
                      <option value="">Select Type</option>
                      <option value="temple">Temple</option>
                      <option value="stupa">Stupa</option>
                      <option value="heritage_complex">Heritage Complex</option>
                      <option value="monument">Monument</option>
                      <option value="archaeological">Archaeological Site</option>
                      <option value="natural">Natural Site</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="heritage_status" className="form-label">
                      Heritage Status
                    </label>
                    <select
                      id="heritage_status"
                      className="form-select"
                      value={formData.heritage_status}
                      onChange={(e) => update('heritage_status', e.target.value as HeritageStatus | '')}
                    >
                      <option value="">Select Heritage Status</option>
                      {HERITAGE_STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status" className="form-label">
                      Publication Status <span className="required">*</span>
                    </label>
                    <select
                      id="status"
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => update('status', e.target.value as HeritageSiteStatus)}
                      required
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Featured</label>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 14px',
                      background: '#f8fafc',
                      border: '2px solid #e9ecef',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: '#2d3748'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => update('is_featured', e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer' }}
                    />
                    <span>Mark this site as featured</span>
                  </label>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Location</span>
                  <h4>Location Details</h4>
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Address <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    className="form-input"
                    value={formData.address}
                    onChange={(e) => update('address', e.target.value)}
                    required
                    placeholder="Swayambhu, Kathmandu"
                  />
                </div>

                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="ward_number" className="form-label">
                      Ward Number <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="ward_number"
                      className="form-input"
                      value={formData.ward_number}
                      onChange={(e) => update('ward_number', e.target.value)}
                      required
                      min={1}
                      max={35}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="palika_id" className="form-label">
                      Palika <span className="required">*</span>
                    </label>
                    <select
                      id="palika_id"
                      className="form-select"
                      value={formData.palika_id}
                      onChange={(e) => update('palika_id', e.target.value)}
                      disabled
                      required
                    >
                      <option value="">Loading...</option>
                      {palikas.map(p => (
                        <option key={p.id} value={p.id.toString()}>{p.name_en}</option>
                      ))}
                    </select>
                    <div className="help-text">
                      Auto-assigned from your admin session
                    </div>
                  </div>
                </div>

                <div className="coordinates-section">
                  <div className="coordinates-header">
                    <span>Geographic Coordinates</span>
                    <small className="help-text">Use Google Maps to find precise coordinates</small>
                  </div>
                  <div className="grid grid-3">
                    <div className="form-group">
                      <label htmlFor="latitude" className="form-label">
                        Latitude <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="latitude"
                        className="form-input"
                        value={formData.latitude}
                        onChange={(e) => update('latitude', e.target.value)}
                        required
                        step="0.000001"
                        placeholder="27.7172"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="longitude" className="form-label">
                        Longitude <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        id="longitude"
                        className="form-input"
                        value={formData.longitude}
                        onChange={(e) => update('longitude', e.target.value)}
                        required
                        step="0.000001"
                        placeholder="85.2903"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="altitude" className="form-label">
                        Altitude (meters)
                      </label>
                      <input
                        type="number"
                        id="altitude"
                        className="form-input"
                        value={formData.altitude}
                        onChange={(e) => update('altitude', e.target.value)}
                        placeholder="77"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ TAB 2: DESCRIPTION ============ */}
          {activeTab === 'description' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Description & Story</h3>
                <p className="section-subtitle">Share the heritage, history, and significance — in English and Nepali</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Summary</span>
                  <h4>Short Description</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="short_description" className="form-label">
                    Short Description (English)
                  </label>
                  <textarea
                    id="short_description"
                    className="form-textarea"
                    value={formData.short_description}
                    onChange={(e) => update('short_description', e.target.value)}
                    placeholder="Brief overview for listings and previews."
                    rows={3}
                  />
                  <div className="help-text">
                    <span>Used for listings and previews. Keep it concise.</span>
                    <span className="char-count">{formData.short_description.length} characters</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="short_description_ne" className="form-label">
                    Short Description (Nepali)
                  </label>
                  <textarea
                    id="short_description_ne"
                    className="form-textarea"
                    value={formData.short_description_ne}
                    onChange={(e) => update('short_description_ne', e.target.value)}
                    placeholder="सूचीहरू र पूर्वावलोकनका लागि संक्षिप्त सारांश।"
                    rows={3}
                  />
                  <div className="help-text">
                    <span>नेपाली भाषामा संक्षिप्त विवरण।</span>
                    <span className="char-count">{formData.short_description_ne.length} characters</span>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Details</span>
                  <h4>Full Description</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="full_description" className="form-label">
                    Full Description (English)
                  </label>
                  <textarea
                    id="full_description"
                    className="form-textarea"
                    value={formData.full_description}
                    onChange={(e) => update('full_description', e.target.value)}
                    placeholder="Historical background, architectural significance, cultural importance..."
                    rows={10}
                  />
                  <div className="help-text">
                    <span>Historical background • Architectural significance • Cultural importance</span>
                    <span className="char-count">{formData.full_description.length} characters</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="full_description_ne" className="form-label">
                    Full Description (Nepali)
                  </label>
                  <textarea
                    id="full_description_ne"
                    className="form-textarea"
                    value={formData.full_description_ne}
                    onChange={(e) => update('full_description_ne', e.target.value)}
                    placeholder="ऐतिहासिक पृष्ठभूमि, वास्तुकला महत्त्व, सांस्कृतिक महत्त्व..."
                    rows={10}
                  />
                  <div className="help-text">
                    <span>नेपाली भाषामा विस्तृत विवरण।</span>
                    <span className="char-count">{formData.full_description_ne.length} characters</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============ TAB 3: VISITOR INFORMATION ============ */}
          {activeTab === 'visitor' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Visitor Information</h3>
                <p className="section-subtitle">Help visitors plan their experience</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Hours</span>
                  <h4>Opening Hours</h4>
                </div>
                <div className="help-text" style={{ marginBottom: 12 }}>
                  <span>Format: <code>HH:MM-HH:MM</code> (e.g. <code>09:00-17:00</code>). Leave blank if closed.</span>
                </div>
                <div className="grid grid-2">
                  {WEEKDAYS.map(day => (
                    <div key={day} className="form-group">
                      <label htmlFor={`opening-${day}`} className="form-label" style={{ textTransform: 'capitalize' }}>
                        {day}
                      </label>
                      <input
                        type="text"
                        id={`opening-${day}`}
                        className="form-input"
                        value={formData.opening_hours[day]}
                        onChange={(e) => updateOpeningHour(day, e.target.value)}
                        placeholder="09:00-17:00"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Fees</span>
                  <h4>Entry Fee</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="fee_local_adult" className="form-label">Local — Adult</label>
                    <input
                      type="number"
                      id="fee_local_adult"
                      className="form-input"
                      value={formData.entry_fee.local_adult}
                      onChange={(e) => updateEntryFee('local_adult', e.target.value)}
                      min={0}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fee_local_child" className="form-label">Local — Child</label>
                    <input
                      type="number"
                      id="fee_local_child"
                      className="form-input"
                      value={formData.entry_fee.local_child}
                      onChange={(e) => updateEntryFee('local_child', e.target.value)}
                      min={0}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fee_foreign_adult" className="form-label">Foreign — Adult</label>
                    <input
                      type="number"
                      id="fee_foreign_adult"
                      className="form-input"
                      value={formData.entry_fee.foreign_adult}
                      onChange={(e) => updateEntryFee('foreign_adult', e.target.value)}
                      min={0}
                      placeholder="1000"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fee_foreign_child" className="form-label">Foreign — Child</label>
                    <input
                      type="number"
                      id="fee_foreign_child"
                      className="form-input"
                      value={formData.entry_fee.foreign_child}
                      onChange={(e) => updateEntryFee('foreign_child', e.target.value)}
                      min={0}
                      placeholder="500"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="fee_currency" className="form-label">Currency</label>
                  <input
                    type="text"
                    id="fee_currency"
                    className="form-input"
                    value={formData.entry_fee.currency}
                    onChange={(e) => updateEntryFee('currency', e.target.value)}
                    placeholder="NPR"
                  />
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Access</span>
                  <h4>Accessibility</h4>
                </div>
                <div className="grid grid-2">
                  {([
                    { key: 'wheelchair_accessible', label: 'Wheelchair accessible' },
                    { key: 'parking', label: 'Parking available' },
                    { key: 'restrooms', label: 'Restrooms available' },
                    { key: 'guide_available', label: 'Guide available' }
                  ] as { key: keyof AccessibilityInfo; label: string }[]).map(item => (
                    <label
                      key={item.key}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        background: '#f8fafc',
                        border: '2px solid #e9ecef',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500,
                        color: '#2d3748'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.accessibility_info[item.key]}
                        onChange={(e) => updateAccessibility(item.key, e.target.checked)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Visit</span>
                  <h4>Planning Your Visit</h4>
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label htmlFor="best_time_to_visit" className="form-label">Best Time to Visit</label>
                    <input
                      type="text"
                      id="best_time_to_visit"
                      className="form-input"
                      value={formData.best_time_to_visit}
                      onChange={(e) => update('best_time_to_visit', e.target.value)}
                      placeholder="October to March"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="average_visit_duration_minutes" className="form-label">
                      Average Visit Duration (minutes)
                    </label>
                    <input
                      type="number"
                      id="average_visit_duration_minutes"
                      className="form-input"
                      value={formData.average_visit_duration_minutes}
                      onChange={(e) => update('average_visit_duration_minutes', e.target.value)}
                      min={1}
                      placeholder="90"
                    />
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Guide</span>
                  <h4>Audio Guide & Languages</h4>
                </div>
                <div className="form-group">
                  <label htmlFor="audio_guide_url" className="form-label">Audio Guide URL</label>
                  <input
                    type="url"
                    id="audio_guide_url"
                    className="form-input"
                    value={formData.audio_guide_url}
                    onChange={(e) => update('audio_guide_url', e.target.value)}
                    placeholder="https://example.com/audio-guide.mp3"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Languages Available</label>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {([
                      { key: 'en' as const, label: 'English (en)' },
                      { key: 'ne' as const, label: 'Nepali (ne)' }
                    ]).map(item => (
                      <label
                        key={item.key}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '12px 14px',
                          background: '#f8fafc',
                          border: '2px solid #e9ecef',
                          borderRadius: 10,
                          cursor: 'pointer',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#2d3748'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.languages_available[item.key]}
                          onChange={(e) => updateLanguage(item.key, e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* TODO: Featured image + images[] — Supabase Storage upload
                  will be wired in a follow-up (see alignment spec step 6). */}
            </div>
          )}

          {/* ============ TAB 4: MEDIA ============ */}
          {activeTab === 'media' && (
            <div className="form-section fade-in">
              <div className="section-header">
                <h3 className="section-title">Photos & Gallery</h3>
                <p className="section-subtitle">Manage visuals for this heritage site</p>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Cover</span>
                  <h4>Featured Image</h4>
                </div>
                <div className="form-group">
                  <label className="form-label">Featured Image URL</label>
                  <div className="image-picker-row">
                    <input
                      type="text"
                      className="form-input"
                      value={formData.featured_image}
                      onChange={(e) => update('featured_image', e.target.value)}
                      placeholder="https://example.com/cover.jpg"
                    />
                  </div>
                  {formData.palika_id ? (
                    <div style={{ marginTop: 12 }}>
                      <AssetGallery
                        palikaId={parseInt(formData.palika_id, 10)}
                        selectMode={true}
                        fileType="image"
                        onAssetSelect={(asset) => update('featured_image', asset.public_url)}
                      />
                    </div>
                  ) : (
                    <div className="help-text">
                      Select a palika in Step 1 to enable gallery selection.
                    </div>
                  )}
                  {formData.featured_image && (
                    <div className="image-preview" style={{ marginTop: 16 }}>
                      <img src={formData.featured_image} alt="Featured Preview" />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <span className="form-card-icon-text">Library</span>
                  <h4>Palika Asset Library</h4>
                </div>
                <p className="help-text" style={{ marginBottom: 16 }}>
                  Upload and manage reusable images for your Palika.
                </p>
                {formData.palika_id ? (
                  <AssetGallery palikaId={parseInt(formData.palika_id, 10)} />
                ) : (
                  <div className="alert alert-warning">
                    Please select a palika in Step 1 to manage the gallery.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <div className="form-actions-left">
              {getCurrentStepIndex() > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab(tabs[getCurrentStepIndex() - 1].id)}
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="form-actions-right">
              {getCurrentStepIndex() < tabs.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab(tabs[getCurrentStepIndex() + 1].id)}
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
                      {loadingLabel}
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      {submitLabel}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
