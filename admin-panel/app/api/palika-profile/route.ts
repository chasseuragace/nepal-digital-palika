import { NextRequest, NextResponse } from 'next/server'
import { getPalikaProfileDatasource } from '@/lib/palika-profile-config'

const datasource = getPalikaProfileDatasource()

/**
 * Fields on the `palikas` table that the palika-profile admin page is
 * responsible for editing (contact info + ward count).
 */
const PALIKA_CONTACT_FIELDS = [
  'office_phone',
  'office_email',
  'website',
  'total_wards'
] as const

type PalikaContactField = typeof PALIKA_CONTACT_FIELDS[number]

// -----------------------------------------------------------------------------
// Lightweight runtime validation (Zod isn't installed in admin-panel).
// Keeps the API defensive without pulling in a new dependency.
// -----------------------------------------------------------------------------
function validatePayload(body: any): { ok: true } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Body must be an object' }
  }

  if (body.highlights !== undefined) {
    if (!Array.isArray(body.highlights)) {
      return { ok: false, error: 'highlights must be an array' }
    }
    for (let i = 0; i < body.highlights.length; i++) {
      const h = body.highlights[i]
      if (!h || typeof h !== 'object') {
        return { ok: false, error: `highlights[${i}] must be an object` }
      }
      if (typeof h.title !== 'string' || typeof h.description !== 'string') {
        return { ok: false, error: `highlights[${i}] must have string title and description` }
      }
      if (h.image_url !== undefined && h.image_url !== null && typeof h.image_url !== 'string') {
        return { ok: false, error: `highlights[${i}].image_url must be a string` }
      }
    }
  }

  if (body.tourism_info !== undefined && (typeof body.tourism_info !== 'object' || Array.isArray(body.tourism_info))) {
    return { ok: false, error: 'tourism_info must be an object' }
  }

  if (body.demographics !== undefined) {
    if (typeof body.demographics !== 'object' || Array.isArray(body.demographics)) {
      return { ok: false, error: 'demographics must be an object' }
    }
    const d = body.demographics
    for (const key of ['population', 'area_sq_km', 'established_year']) {
      if (d[key] !== undefined && d[key] !== null && typeof d[key] !== 'number') {
        return { ok: false, error: `demographics.${key} must be a number` }
      }
    }
  }

  if (body.videos !== undefined) {
    if (!Array.isArray(body.videos) || body.videos.some((v: unknown) => typeof v !== 'string')) {
      return { ok: false, error: 'videos must be an array of strings' }
    }
  }

  if (body.gallery_images !== undefined) {
    if (!Array.isArray(body.gallery_images) || body.gallery_images.some((v: unknown) => typeof v !== 'string')) {
      return { ok: false, error: 'gallery_images must be an array of strings' }
    }
  }

  return { ok: true }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
async function fetchPalikaContactInfo(palikaId: number): Promise<Partial<Record<PalikaContactField, any>> | null> {
  try {
    return await datasource.getPalikaContactInfo(palikaId)
  } catch (err) {
    console.warn('[palika-profile] could not fetch palikas contact info:', err)
    return null
  }
}

async function updatePalikaContactInfo(
  palikaId: number,
  payload: Partial<Record<PalikaContactField, any>>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const updates: Record<string, any> = {}
  for (const field of PALIKA_CONTACT_FIELDS) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field]
    }
  }
  if (Object.keys(updates).length === 0) {
    return { ok: true }
  }

  try {
    await datasource.updatePalikaContactInfo(palikaId, updates)
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Unknown error updating palikas' }
  }
}

/**
 * Sync `assets` rows (file_type='image') into
 * `palika_profiles.gallery_images` JSONB so m-place can read the gallery.
 *
 * Best-effort: if the underlying client is mocked (fake datasources / mock auth),
 * this silently no-ops and returns null so the main save still succeeds.
 */
async function syncGalleryImages(palikaId: number): Promise<string[] | null> {
  try {
    return await datasource.syncGalleryImages(palikaId)
  } catch (err) {
    console.warn('[palika-profile] gallery sync unavailable:', err)
    return null
  }
}

// -----------------------------------------------------------------------------
// GET
// -----------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const palikaIdParam = request.nextUrl.searchParams.get('palika_id')
    const palikaId = palikaIdParam ? parseInt(palikaIdParam, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    // Fetch the profile JSONB record and contact info in parallel.
    const [profile, contact] = await Promise.all([
      datasource.getByPalikaId(palikaId),
      fetchPalikaContactInfo(palikaId)
    ])

    // If no profile exists, return empty profile structure (still including contact info).
    if (!profile) {
      return NextResponse.json({
        profile: {
          id: null,
          palika_id: palikaId,
          description_en: '',
          description_ne: '',
          featured_image: '',
          gallery_images: [],
          highlights: [],
          tourism_info: {
            best_time_to_visit: '',
            accessibility: '',
            languages: [],
            currency: 'NPR'
          },
          demographics: {
            population: 0,
            area_sq_km: 0,
            established_year: 0
          },
          videos: [],
          office_phone: contact?.office_phone ?? '',
          office_email: contact?.office_email ?? '',
          website: contact?.website ?? '',
          total_wards: contact?.total_wards ?? 0
        }
      })
    }

    return NextResponse.json({
      profile: {
        ...profile,
        office_phone: contact?.office_phone ?? '',
        office_email: contact?.office_email ?? '',
        website: contact?.website ?? '',
        total_wards: contact?.total_wards ?? 0
      }
    })
  } catch (error) {
    console.error('Error in GET /api/palika-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// -----------------------------------------------------------------------------
// PUT
// -----------------------------------------------------------------------------
export async function PUT(request: NextRequest) {
  try {
    const palikaIdHeader = request.headers.get('X-Palika-ID')
    const palikaId = palikaIdHeader ? parseInt(palikaIdHeader, 10) : null

    if (!palikaId) {
      return NextResponse.json(
        { error: 'X-Palika-ID header is required' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.description_en && !body.description_ne) {
      return NextResponse.json(
        { error: 'At least one description is required' },
        { status: 400 }
      )
    }

    // Shape validation (Zod-lite)
    const validation = validatePayload(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Separate contact-info fields from palika_profiles fields.
    const contactPayload: Partial<Record<PalikaContactField, any>> = {}
    for (const field of PALIKA_CONTACT_FIELDS) {
      if (body[field] !== undefined) {
        contactPayload[field] = body[field]
      }
    }
    const profilePayload: Record<string, any> = { ...body }
    for (const field of PALIKA_CONTACT_FIELDS) {
      delete profilePayload[field]
    }

    // 1. Upsert palika_profiles (primary operation — must succeed).
    const profile = await datasource.upsert(palikaId, profilePayload)

    // 2. Sync palika_gallery → palika_profiles.gallery_images.
    //    Runs after the upsert so the row exists; best-effort.
    const syncedGallery = await syncGalleryImages(palikaId)

    // 3. Update palikas contact info (secondary — partial failure tolerated).
    let warning: string | undefined
    const contactResult = await updatePalikaContactInfo(palikaId, contactPayload)
    if (!contactResult.ok) {
      warning = `Profile saved, but contact info update failed: ${contactResult.error}`
      console.warn('[palika-profile] contact info update failed:', contactResult.error)
    }

    // Re-fetch current contact info so response reflects DB state.
    const contact = await fetchPalikaContactInfo(palikaId)

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        gallery_images: syncedGallery ?? profile.gallery_images ?? [],
        office_phone: contact?.office_phone ?? contactPayload.office_phone ?? '',
        office_email: contact?.office_email ?? contactPayload.office_email ?? '',
        website: contact?.website ?? contactPayload.website ?? '',
        total_wards: contact?.total_wards ?? contactPayload.total_wards ?? 0
      },
      ...(warning ? { warning } : {})
    })
  } catch (error) {
    console.error('Error in PUT /api/palika-profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
