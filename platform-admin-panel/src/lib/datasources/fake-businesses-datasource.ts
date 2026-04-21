import { Business, ApprovalRule } from '@/lib/types'
import {
  AddNoteInput,
  ApprovalNoteWithAuthor,
  ApprovalStatusInput,
  ApprovalStatusResult,
  BusinessApprovalDetails,
  BusinessApprovalsFilters,
  BusinessApprovalsPagination,
  BusinessApprovalsResult,
  CreateBusinessInput,
  IBusinessesDatasource,
} from './businesses-datasource'

interface FakePalika {
  id: number
  name_en: string
  name_ne: string
  district_id: number
}

interface FakeDistrict {
  id: number
  name_en: string
  name_ne: string
}

interface FakeImage {
  id: string
  image_url: string
  is_featured: boolean
  sort_order: number
}

interface FakeNote {
  id: string
  business_id: string
  content: string
  is_internal: boolean
  author_id: string | null
  author_name: string
  created_at: string
  updated_at: string
}

interface FakeBusiness extends Business {
  district_id?: number
  images: FakeImage[]
}

const PALIKAS: Record<number, FakePalika> = {
  2: { id: 2, name_en: 'Kathmandu Metropolitan', name_ne: 'काठमाडौं महानगर', district_id: 27 },
  5: { id: 5, name_en: 'Lalitpur Metropolitan', name_ne: 'ललितपुर महानगर', district_id: 28 },
  8: { id: 8, name_en: 'Pokhara Metropolitan', name_ne: 'पोखरा महानगर', district_id: 47 },
  10: { id: 10, name_en: 'Bhaktapur Municipality', name_ne: 'भक्तपुर नगर', district_id: 29 },
}

const DISTRICTS: Record<number, FakeDistrict> = {
  27: { id: 27, name_en: 'Kathmandu', name_ne: 'काठमाडौं' },
  28: { id: 28, name_en: 'Lalitpur', name_ne: 'ललितपुर' },
  29: { id: 29, name_en: 'Bhaktapur', name_ne: 'भक्तपुर' },
  47: { id: 47, name_en: 'Kaski', name_ne: 'कास्की' },
}

const ADMIN_ID_RAMESH = '880e8400-e29b-41d4-a716-446655440010'
const ADMIN_ID_SITA = '880e8400-e29b-41d4-a716-446655440011'

const WORKFLOW_RULES: ApprovalRule[] = [
  {
    id: 'rule-1',
    name: 'Verify contact phone',
    description: 'Confirm the business phone is reachable',
    enabled: true,
    order: 1,
    rule_type: 'data_quality',
  },
  {
    id: 'rule-2',
    name: 'Verify address',
    description: 'Ensure address matches palika jurisdiction',
    enabled: true,
    order: 2,
    rule_type: 'compliance',
  },
  {
    id: 'rule-3',
    name: 'Safety checklist',
    description: 'Homestays must pass fire/safety checklist',
    enabled: false,
    order: 3,
    rule_type: 'safety',
  },
]

function nowOffset(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()
}

function makeId(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(8, '0')}-fake-fake-fake-fakefakefake`
}

function seed(): FakeBusiness[] {
  const base: Array<Partial<FakeBusiness>> = [
    {
      id: makeId('biz', 1),
      palika_id: 2,
      business_name: 'Thamel Heritage Homestay',
      business_name_ne: 'ठमेल हेरिटेज होमस्टे',
      category: 'homestay',
      entity_type: 'homestay',
      contact_phone: '9841000001',
      contact_email: 'thamel@example.com',
      address: 'Thamel-26, Kathmandu',
      ward_number: 26,
      description: 'Traditional Newari homestay in Thamel',
      status: 'pending_review',
      verification_status: 'pending',
      is_published: false,
      created_at: nowOffset(2),
    },
    {
      id: makeId('biz', 2),
      palika_id: 5,
      business_name: 'Patan Artisan Workshop',
      business_name_ne: 'पाटन शिल्पकर्म',
      category: 'artisan',
      entity_type: 'artisan',
      contact_phone: '9841000002',
      address: 'Patan Durbar Square',
      ward_number: 10,
      description: 'Metal craft artisan studio',
      status: 'pending_review',
      verification_status: 'pending',
      is_published: false,
      created_at: nowOffset(8),
    },
    {
      id: makeId('biz', 3),
      palika_id: 8,
      business_name: 'Lakeside Boat Tours',
      business_name_ne: 'लेकसाइड बोट टुर',
      category: 'service',
      entity_type: 'service',
      contact_phone: '9841000003',
      contact_email: 'boats@example.com',
      address: 'Lakeside, Pokhara',
      ward_number: 6,
      description: 'Phewa lake boating and guided tours',
      status: 'pending_review',
      verification_status: 'pending',
      is_published: false,
      created_at: nowOffset(20),
    },
    {
      id: makeId('biz', 4),
      palika_id: 10,
      business_name: 'Bhaktapur Juju Dhau',
      business_name_ne: 'भक्तपुर जुजु धौ',
      category: 'producer',
      entity_type: 'producer',
      contact_phone: '9841000004',
      address: 'Taumadhi Square, Bhaktapur',
      ward_number: 3,
      description: 'Traditional king curd producer',
      status: 'draft',
      verification_status: 'pending',
      is_published: false,
      created_at: nowOffset(48),
    },
    {
      id: makeId('biz', 5),
      palika_id: 2,
      business_name: 'Swayambhu Singing Bowls',
      business_name_ne: 'स्वयम्भू गायन कचौरा',
      category: 'artisan',
      entity_type: 'artisan',
      contact_phone: '9841000005',
      address: 'Swayambhu-15, Kathmandu',
      ward_number: 15,
      description: 'Handcrafted singing bowls',
      status: 'draft',
      verification_status: 'pending',
      is_published: false,
      created_at: nowOffset(72),
    },
    {
      id: makeId('biz', 6),
      palika_id: 5,
      business_name: 'Godawari Eco Lodge',
      business_name_ne: 'गोदावरी इको लज',
      category: 'homestay',
      entity_type: 'homestay',
      contact_phone: '9841000006',
      contact_email: 'godawari@example.com',
      address: 'Godawari, Lalitpur',
      ward_number: 14,
      description: 'Forest-adjacent eco lodge',
      status: 'approved',
      verification_status: 'approved',
      is_published: true,
      created_at: nowOffset(24 * 7),
    },
    {
      id: makeId('biz', 7),
      palika_id: 8,
      business_name: 'Sarangkot Sunrise Homestay',
      business_name_ne: 'सरांकोट सनराइज होमस्टे',
      category: 'homestay',
      entity_type: 'homestay',
      contact_phone: '9841000007',
      address: 'Sarangkot, Pokhara',
      ward_number: 20,
      description: 'Sunrise view homestay',
      status: 'approved',
      verification_status: 'approved',
      is_published: true,
      created_at: nowOffset(24 * 10),
    },
    {
      id: makeId('biz', 8),
      palika_id: 10,
      business_name: 'Nyatapola Pottery',
      business_name_ne: 'न्यातपोल मृत्भाण्ड',
      category: 'artisan',
      entity_type: 'artisan',
      contact_phone: '9841000008',
      address: 'Pottery Square, Bhaktapur',
      ward_number: 8,
      description: 'Traditional wheel pottery',
      status: 'approved',
      verification_status: 'approved',
      is_published: true,
      created_at: nowOffset(24 * 14),
    },
    {
      id: makeId('biz', 9),
      palika_id: 2,
      business_name: 'Ghost Restaurant',
      business_name_ne: 'अनधिकृत रेस्टुरेन्ट',
      category: 'service',
      entity_type: 'service',
      contact_phone: '9841000009',
      address: 'Unknown alley, Kathmandu',
      description: 'Failed verification checks',
      status: 'rejected',
      verification_status: 'rejected',
      is_published: false,
      reviewer_feedback: 'Address could not be verified',
      created_at: nowOffset(24 * 5),
    },
  ]

  return base.map((b, i) => {
    const palika = PALIKAS[b.palika_id as number]
    return {
      id: b.id!,
      palika_id: b.palika_id!,
      owner_user_id: undefined,
      business_name: b.business_name!,
      business_name_ne: b.business_name_ne,
      business_type: (b as any).business_type,
      category: b.category,
      entity_type: b.entity_type as any,
      contact_phone: b.contact_phone!,
      contact_email: b.contact_email,
      contact_website: undefined,
      address: b.address!,
      ward_number: b.ward_number,
      coordinates: undefined,
      description: b.description,
      description_ne: undefined,
      operating_hours: undefined,
      is_24_7: false,
      languages_spoken: ['nepali', 'english'],
      featured_image_url: undefined,
      price_range: undefined,
      facilities: undefined,
      owner_info: { name: `Owner ${i + 1}`, phone: b.contact_phone },
      status: b.status as any,
      verification_status: b.verification_status as any,
      reviewer_feedback: (b as any).reviewer_feedback,
      reviewer_id: undefined,
      is_published: !!b.is_published,
      is_featured: false,
      view_count: 0,
      created_at: b.created_at!,
      updated_at: b.created_at!,
      district_id: palika?.district_id,
      images: [
        {
          id: `${b.id}-img-1`,
          image_url: `https://picsum.photos/seed/${b.id}-1/600/400`,
          is_featured: true,
          sort_order: 0,
        },
        {
          id: `${b.id}-img-2`,
          image_url: `https://picsum.photos/seed/${b.id}-2/600/400`,
          is_featured: false,
          sort_order: 1,
        },
      ],
    } as FakeBusiness
  })
}

function seedNotes(): FakeNote[] {
  return [
    {
      id: 'note-0001',
      business_id: makeId('biz', 1),
      content: 'Contacted owner, documents pending.',
      is_internal: true,
      author_id: ADMIN_ID_RAMESH,
      author_name: 'Ramesh Sharma',
      created_at: nowOffset(1),
      updated_at: nowOffset(1),
    },
    {
      id: 'note-0002',
      business_id: makeId('biz', 1),
      content: 'Phone verified.',
      is_internal: true,
      author_id: ADMIN_ID_SITA,
      author_name: 'Sita Koirala',
      created_at: nowOffset(0.5),
      updated_at: nowOffset(0.5),
    },
    {
      id: 'note-0003',
      business_id: makeId('biz', 2),
      content: 'Awaiting site visit photos.',
      is_internal: true,
      author_id: ADMIN_ID_RAMESH,
      author_name: 'Ramesh Sharma',
      created_at: nowOffset(6),
      updated_at: nowOffset(6),
    },
    {
      id: 'note-0004',
      business_id: makeId('biz', 3),
      content: 'Boat safety certificate missing.',
      is_internal: true,
      author_id: ADMIN_ID_SITA,
      author_name: 'Sita Koirala',
      created_at: nowOffset(18),
      updated_at: nowOffset(18),
    },
  ]
}

const g = globalThis as any
const BUSINESSES: FakeBusiness[] = g.__fake_businesses ?? (g.__fake_businesses = seed())
const NOTES: FakeNote[] = g.__fake_business_notes ?? (g.__fake_business_notes = seedNotes())
if (typeof g.__fake_business_counter !== 'number') {
  g.__fake_business_counter = BUSINESSES.length + 100
}

export class FakeBusinessesDatasource implements IBusinessesDatasource {
  async create(input: CreateBusinessInput): Promise<Business> {
    const id = makeId('biz', ++g.__fake_business_counter)
    const palika = PALIKAS[input.palika_id]
    const status = input._status ?? 'draft'
    const isPublished = input._isPublished ?? false
    const now = new Date().toISOString()

    const created: FakeBusiness = {
      id,
      palika_id: input.palika_id,
      owner_user_id: undefined,
      business_name: input.business_name,
      business_name_ne: input.business_name_ne,
      business_type: input.business_type,
      category: input.category,
      entity_type: input.entity_type as any,
      contact_phone: input.contact_phone,
      contact_email: input.contact_email,
      contact_website: input.contact_website,
      address: input.address,
      ward_number: input.ward_number,
      coordinates: input.coordinates,
      description: input.description,
      description_ne: input.description_ne,
      operating_hours: input.operating_hours,
      is_24_7: !!input.is_24_7,
      languages_spoken: input.languages_spoken || [],
      featured_image_url: undefined,
      price_range: input.price_range,
      facilities: input.facilities,
      owner_info: input.owner_info,
      status: status as any,
      verification_status: 'pending',
      reviewer_feedback: undefined,
      reviewer_id: undefined,
      is_published: isPublished,
      is_featured: false,
      view_count: 0,
      created_at: now,
      updated_at: now,
      district_id: palika?.district_id,
      images: [],
    }

    BUSINESSES.unshift(created)
    return created as Business
  }

  async findById(id: string): Promise<Business | null> {
    return BUSINESSES.find((b) => b.id === id) || null
  }

  async getApprovals(
    filters: BusinessApprovalsFilters,
    pagination: BusinessApprovalsPagination
  ): Promise<BusinessApprovalsResult> {
    let list = BUSINESSES.slice()

    if (filters.palika_id) {
      list = list.filter((b) => b.palika_id === filters.palika_id)
    }

    if (filters.status) {
      list = list.filter((b) => b.status === filters.status)
    } else {
      list = list.filter(
        (b) => b.status === 'pending_review' || b.status === 'draft'
      )
    }

    if (filters.category) {
      list = list.filter((b) => b.category === filters.category)
    }

    if (filters.start_date) {
      list = list.filter((b) => b.created_at >= filters.start_date!)
    }
    if (filters.end_date) {
      list = list.filter((b) => b.created_at <= filters.end_date!)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (b) =>
          b.business_name.toLowerCase().includes(q) ||
          (b.business_name_ne || '').toLowerCase().includes(q)
      )
    }

    list.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

    const count = list.length
    const offset = (pagination.page - 1) * pagination.limit
    const slice = list.slice(offset, offset + pagination.limit)

    const data = slice.map((b) => ({
      id: b.id,
      business_name: b.business_name,
      business_name_ne: b.business_name_ne,
      category: b.category,
      palika_id: b.palika_id,
      contact_phone: b.contact_phone,
      contact_email: b.contact_email,
      status: b.status,
      verification_status: b.verification_status,
      created_at: b.created_at,
      owner_info: b.owner_info,
      featured_image_url: b.featured_image_url,
      palikas: PALIKAS[b.palika_id]
        ? {
            id: PALIKAS[b.palika_id].id,
            name_en: PALIKAS[b.palika_id].name_en,
            name_ne: PALIKAS[b.palika_id].name_ne,
          }
        : null,
    }))

    return { data, count }
  }

  async getApprovalDetails(
    id: string
  ): Promise<BusinessApprovalDetails | null> {
    const b = BUSINESSES.find((x) => x.id === id)
    if (!b) return null

    const palika = PALIKAS[b.palika_id]
    const district = palika ? DISTRICTS[palika.district_id] : undefined
    const notes = NOTES.filter((n) => n.business_id === id).map((n) => ({
      id: n.id,
      content: n.content,
      is_internal: n.is_internal,
      created_at: n.created_at,
      author_id: n.author_id,
      admin_users: n.author_name ? { full_name: n.author_name } : null,
    }))

    return {
      id: b.id,
      business_name: b.business_name,
      business_name_ne: b.business_name_ne,
      business_type: b.business_type,
      category: b.category,
      entity_type: b.entity_type,
      contact_phone: b.contact_phone,
      contact_email: b.contact_email,
      contact_website: b.contact_website,
      address: b.address,
      ward_number: b.ward_number,
      coordinates: b.coordinates,
      location: undefined,
      description: b.description,
      description_ne: b.description_ne,
      operating_hours: b.operating_hours,
      is_24_7: b.is_24_7,
      languages_spoken: b.languages_spoken,
      price_range: b.price_range,
      facilities: b.facilities,
      status: b.status,
      verification_status: b.verification_status,
      reviewer_feedback: b.reviewer_feedback,
      reviewer_id: b.reviewer_id,
      is_published: b.is_published,
      created_at: b.created_at,
      created_by: undefined,
      updated_at: b.updated_at,
      owner_user_id: b.owner_user_id,
      owner_info: b.owner_info,
      palika: palika
        ? {
            id: palika.id,
            name_en: palika.name_en,
            name_ne: palika.name_ne,
            district_id: palika.district_id,
          }
        : null,
      district: district
        ? { id: district.id, name_en: district.name_en, name_ne: district.name_ne }
        : null,
      images: b.images as any,
      featured_image_url: b.featured_image_url,
      approval_notes: notes,
      verification_rules: WORKFLOW_RULES.filter((r) => r.enabled),
    }
  }

  async addNote(
    businessId: string,
    input: AddNoteInput
  ): Promise<ApprovalNoteWithAuthor> {
    const now = new Date().toISOString()
    const id = `note-${String(NOTES.length + 1).padStart(4, '0')}`
    const authorName = input.author_id ? 'Reviewer' : 'Unknown'
    const note: FakeNote = {
      id,
      business_id: businessId,
      content: input.content,
      is_internal: input.is_internal,
      author_id: input.author_id,
      author_name: authorName,
      created_at: now,
      updated_at: now,
    }
    NOTES.push(note)
    return {
      id: note.id,
      business_id: note.business_id,
      content: note.content,
      is_internal: note.is_internal,
      author_id: note.author_id ?? undefined,
      author_name: note.author_name,
      created_at: note.created_at,
      updated_at: note.updated_at,
    }
  }

  async getNotes(businessId: string): Promise<ApprovalNoteWithAuthor[]> {
    return NOTES.filter((n) => n.business_id === businessId && n.is_internal)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((n) => ({
        id: n.id,
        business_id: n.business_id,
        content: n.content,
        is_internal: n.is_internal,
        author_id: n.author_id ?? undefined,
        author_name: n.author_name,
        created_at: n.created_at,
        updated_at: n.updated_at,
      }))
  }

  async updateApprovalStatus(
    id: string,
    input: ApprovalStatusInput
  ): Promise<ApprovalStatusResult> {
    const b = BUSINESSES.find((x) => x.id === id)
    if (!b) throw new Error('Business not found')

    let newVerificationStatus: string
    let isPublished: boolean
    let updatedStatus: string

    if (input.status === 'approved') {
      newVerificationStatus = 'approved'
      isPublished = true
      updatedStatus = 'approved'
    } else if (input.status === 'rejected') {
      newVerificationStatus = 'rejected'
      isPublished = false
      updatedStatus = 'rejected'
    } else {
      newVerificationStatus = 'pending'
      isPublished = false
      updatedStatus = 'pending_review'
    }

    b.verification_status = newVerificationStatus as any
    b.status = updatedStatus as any
    b.is_published = isPublished
    b.reviewer_feedback = input.reason || undefined
    b.reviewer_id = input.reviewerId || undefined
    b.updated_at = new Date().toISOString()

    return {
      verification_status: newVerificationStatus,
      status: updatedStatus,
      is_published: isPublished,
    }
  }
}
