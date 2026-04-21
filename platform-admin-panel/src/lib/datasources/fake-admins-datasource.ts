import { randomUUID } from 'crypto'
import {
  AdminEntity,
  CreateAdminInput,
  IAdminsDatasource,
} from './admins-datasource'

const kathmanduPalika = {
  id: 2,
  name_en: 'Kathmandu Metropolitan City',
  district_id: 27,
  districts: {
    id: 27,
    name_en: 'Kathmandu',
    province_id: 3,
    provinces: { id: 3, name_en: 'Bagmati Province' },
  },
}

const lalitpurPalika = {
  id: 5,
  name_en: 'Lalitpur Metropolitan City',
  district_id: 28,
  districts: {
    id: 28,
    name_en: 'Lalitpur',
    province_id: 3,
    provinces: { id: 3, name_en: 'Bagmati Province' },
  },
}

const seed: AdminEntity[] = [
  {
    id: '880e8400-e29b-41d4-a716-446655440001',
    full_name: 'Super Admin',
    role: 'super_admin',
    palika_id: null,
    is_active: true,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    palikas: null,
    email: 'superadmin@nepaltourism.dev',
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440002',
    full_name: 'Province Admin Bagmati',
    role: 'province_admin',
    palika_id: null,
    is_active: true,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    palikas: null,
    email: 'province.bagmati@nepaltourism.dev',
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440003',
    full_name: 'District Admin Kathmandu',
    role: 'district_admin',
    palika_id: null,
    is_active: true,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    palikas: null,
    email: 'district.kathmandu@nepaltourism.dev',
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440004',
    full_name: 'Palika Admin Kathmandu',
    role: 'palika_admin',
    palika_id: 2,
    is_active: true,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    palikas: kathmanduPalika,
    email: 'palika.admin@kathmandu.gov.np',
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440005',
    full_name: 'Content Moderator',
    role: 'moderator',
    palika_id: 5,
    is_active: true,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    palikas: lalitpurPalika,
    email: 'content.moderator@kathmandu.gov.np',
  },
]

const g = globalThis as any
const ADMINS: AdminEntity[] = g.__fake_admins ?? (g.__fake_admins = [...seed])

export class FakeAdminsDatasource implements IAdminsDatasource {
  private admins: AdminEntity[] = ADMINS

  async getAll(): Promise<AdminEntity[]> {
    return [...this.admins].sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    )
  }

  async getById(id: string): Promise<AdminEntity | null> {
    return this.admins.find((a) => a.id === id) || null
  }

  async create(input: CreateAdminInput): Promise<AdminEntity> {
    const { email, full_name, role, palika_id } = input

    let palikas: AdminEntity['palikas'] = null
    if (role === 'palika_admin' && palika_id) {
      palikas = palika_id === 2 ? kathmanduPalika : lalitpurPalika
    }

    const entity: AdminEntity = {
      id: randomUUID(),
      full_name,
      role,
      palika_id: palika_id ?? null,
      is_active: true,
      created_at: new Date().toISOString(),
      palikas,
      email,
    }
    this.admins.push(entity)
    return entity
  }

  async delete(id: string): Promise<void> {
    const idx = this.admins.findIndex((a) => a.id === id)
    if (idx >= 0) this.admins.splice(idx, 1)
  }
}
