import type { Event } from '@/services/types'
import { EMPTY_EVENT_FORM, type EventFormState } from './EventForm'

/**
 * Build an EventFormState from a server-side Event record.
 * Used by the edit page to initialise the shared form.
 */
export function hydrateEventForm(event: Partial<Event>): EventFormState {
  const recurrence = event.recurrence_pattern
  const allowedRecurrence: EventFormState['recurrence_pattern'][] = [
    'none',
    'daily',
    'weekly',
    'monthly',
    'yearly'
  ]
  const safeRecurrence = allowedRecurrence.includes(
    recurrence as EventFormState['recurrence_pattern']
  )
    ? (recurrence as EventFormState['recurrence_pattern'])
    : 'none'

  const allowedStatus: EventFormState['status'][] = ['draft', 'published', 'archived']
  const safeStatus = allowedStatus.includes(event.status as EventFormState['status'])
    ? (event.status as EventFormState['status'])
    : 'draft'

  const lat = event.location?.lat
  const lng = event.location?.lng

  // start/end come back as ISO strings or YYYY-MM-DD; normalise to YYYY-MM-DD for <input type="date">.
  const toDateInput = (v?: string) => {
    if (!v) return ''
    // If already YYYY-MM-DD, keep. Else parse and slice.
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
    const d = new Date(v)
    if (Number.isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  }

  return {
    ...EMPTY_EVENT_FORM,
    name_en: event.name_en ?? '',
    name_ne: event.name_ne ?? '',
    event_type: event.event_type ?? '',
    is_festival: !!event.is_festival,
    category_id: event.category_id != null ? String(event.category_id) : '',
    status: safeStatus,
    start_date: toDateInput(event.start_date),
    end_date: toDateInput(event.end_date),
    nepali_calendar_date: event.nepali_calendar_date ?? '',
    recurrence_pattern: safeRecurrence,
    palika_id: event.palika_id != null ? String(event.palika_id) : '',
    venue_name: event.venue_name ?? '',
    latitude: lat != null ? String(lat) : '',
    longitude: lng != null ? String(lng) : '',
    short_description: event.short_description ?? '',
    short_description_ne: event.short_description_ne ?? '',
    full_description: event.full_description ?? '',
    full_description_ne: event.full_description_ne ?? '',
    featured_image: event.featured_image ?? ''
  }
}
