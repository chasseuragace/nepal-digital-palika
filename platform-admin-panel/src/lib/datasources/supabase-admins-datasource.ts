import { SupabaseClient } from '@supabase/supabase-js'
import {
  AdminEntity,
  CreateAdminInput,
  IAdminsDatasource,
} from './admins-datasource'

const ADMIN_SELECT = `
  id,
  full_name,
  role,
  palika_id,
  is_active,
  created_at,
  palikas(
    id,
    name_en,
    district_id,
    districts(
      id,
      name_en,
      province_id,
      provinces(
        id,
        name_en
      )
    )
  )
`

export class SupabaseAdminsDatasource implements IAdminsDatasource {
  constructor(private client: SupabaseClient) {}

  /** List all admin users with nested region relations and emails. */
  async getAll(): Promise<AdminEntity[]> {
    const { data: admins, error } = await this.client
      .from('admin_users')
      .select(ADMIN_SELECT)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    const { data: { users } } = await this.client.auth.admin.listUsers()
    const emailMap = new Map(users?.map((u) => [u.id, u.email]) || [])

    return (admins || []).map((admin: any) => ({
      ...admin,
      email: emailMap.get(admin.id) || 'N/A',
    })) as AdminEntity[]
  }

  /** Fetch a single admin by id with email. */
  async getById(id: string): Promise<AdminEntity | null> {
    const { data: admin, error } = await this.client
      .from('admin_users')
      .select(ADMIN_SELECT)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    if (!admin) return null

    const { data: { user } } = await this.client.auth.admin.getUserById(id)

    return { ...(admin as any), email: user?.email || 'N/A' } as AdminEntity
  }

  /** Create auth user, admin profile, and admin_regions entry (with rollback). */
  async create(input: CreateAdminInput): Promise<AdminEntity> {
    const { email, password, full_name, role, province_id, district_id, palika_id } = input

    let hierarchyLevel: string
    switch (role) {
      case 'province_admin':
        hierarchyLevel = 'province'
        break
      case 'district_admin':
        hierarchyLevel = 'district'
        break
      case 'palika_admin':
        hierarchyLevel = 'palika'
        break
      default:
        hierarchyLevel = 'national'
    }

    const { data: authData, error: authError } = await this.client.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })

    if (authError) throw new Error(`Failed to create auth user: ${authError.message}`)
    if (!authData.user) throw new Error('No user data returned from auth creation')

    const { data: adminData, error: adminError } = await this.client
      .from('admin_users')
      .insert({
        id: authData.user.id,
        full_name,
        role,
        hierarchy_level: hierarchyLevel,
        province_id: province_id || null,
        district_id: district_id || null,
        palika_id: palika_id || null,
        is_active: true,
      })
      .select(ADMIN_SELECT)
      .single()

    if (adminError) {
      await this.client.auth.admin.deleteUser(authData.user.id)
      throw new Error(`Failed to create admin profile: ${adminError.message}`)
    }

    let regionType: 'province' | 'district' | 'palika'
    let regionId: number

    if (role === 'province_admin') {
      regionType = 'province'
      regionId = province_id!
    } else if (role === 'district_admin') {
      regionType = 'district'
      regionId = district_id!
    } else {
      regionType = 'palika'
      regionId = palika_id!
    }

    const { error: regionError } = await this.client
      .from('admin_regions')
      .insert({
        admin_id: authData.user.id,
        region_type: regionType,
        region_id: regionId,
      })

    if (regionError) {
      await this.client.auth.admin.deleteUser(authData.user.id)
      await this.client.from('admin_users').delete().eq('id', authData.user.id)
      throw new Error(`Failed to assign admin region: ${regionError.message}`)
    }

    return { ...(adminData as any), email } as AdminEntity
  }

  /** Delete admin profile and auth user. */
  async delete(id: string): Promise<void> {
    const { error: adminError } = await this.client
      .from('admin_users')
      .delete()
      .eq('id', id)

    if (adminError) throw new Error(`Failed to delete admin profile: ${adminError.message}`)

    try {
      await this.client.auth.admin.deleteUser(id)
    } catch (authError: any) {
      console.warn(`Warning: Could not delete auth user ${id}:`, authError.message)
    }
  }
}
