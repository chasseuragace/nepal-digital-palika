/**
 * Supabase Regions Datasource
 */

import { IRegionsDatasource, ProvinceWithAdmins, DistrictWithAdmins, PalikaWithAdmins, AdminAssignment } from './regions-datasource'
import { SupabaseClient } from '@supabase/supabase-js'
import { DatabaseError, ValidationError } from './datasource-errors'

export class SupabaseRegionsDatasource implements IRegionsDatasource {
  constructor(private db: SupabaseClient) {}

  async getRegionHierarchy(): Promise<ProvinceWithAdmins[]> {
    // Fetch provinces with their districts and palikas
    const { data: provinces, error: provError } = await this.db
      .from('provinces')
      .select('id, name_en, name_ne, code')
      .order('name_en')

    if (provError) {
      console.error('Error fetching provinces:', provError)
      throw new DatabaseError('Failed to fetch provinces', 'FETCH_PROVINCES_ERROR', provError)
    }

    // Fetch districts
    const { data: districts, error: distError } = await this.db
      .from('districts')
      .select('id, province_id, name_en, name_ne, code')
      .order('name_en')

    if (distError) {
      console.error('Error fetching districts:', distError)
      throw new DatabaseError('Failed to fetch districts', 'FETCH_DISTRICTS_ERROR', distError)
    }

    // Fetch palikas
    const { data: palikas, error: palError } = await this.db
      .from('palikas')
      .select('id, district_id, name_en, name_ne, code, type')
      .order('name_en')

    if (palError) {
      console.error('Error fetching palikas:', palError)
      throw new DatabaseError('Failed to fetch palikas', 'FETCH_PALIKAS_ERROR', palError)
    }

    // Fetch admin assignments
    const { data: adminRegions, error: adminError } = await this.db
      .from('admin_regions')
      .select('id, admin_id, region_type, region_id, assigned_at, admin_users!admin_regions_admin_id_fkey(id, full_name, role)')

    if (adminError) {
      console.error('Error fetching admin regions:', adminError)
      throw new DatabaseError('Failed to fetch admin assignments', 'FETCH_ADMIN_ASSIGNMENTS_ERROR', adminError)
    }

    // Build hierarchical structure
    const hierarchyData = (provinces || []).map(province => ({
      ...province,
      type: 'province',
      admins: (adminRegions || []).filter(ar => ar.region_type === 'province' && ar.region_id === province.id),
      districts: (districts || [])
        .filter(d => d.province_id === province.id)
        .map(district => ({
          ...district,
          type: 'district',
          admins: (adminRegions || []).filter(ar => ar.region_type === 'district' && ar.region_id === district.id),
          palikas: (palikas || [])
            .filter(p => p.district_id === district.id)
            .map(palika => ({
              ...palika,
              type: 'palika',
              admins: (adminRegions || []).filter(ar => ar.region_type === 'palika' && ar.region_id === palika.id)
            }))
        }))
    }))

    return hierarchyData
  }

  async assignAdminToRegion(adminId: string, regionType: string, regionId: number): Promise<AdminAssignment> {
    // Check if assignment already exists
    const { data: existing, error: checkError } = await this.db
      .from('admin_regions')
      .select('*')
      .eq('admin_id', adminId)
      .eq('region_type', regionType)
      .eq('region_id', regionId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking assignment:', checkError)
      throw new DatabaseError('Failed to assign admin', 'CHECK_ASSIGNMENT_ERROR', checkError)
    }

    if (existing) {
      throw new ValidationError('Admin is already assigned to this region', 'ADMIN_ALREADY_ASSIGNED')
    }

    // Create assignment
    const { data: assignment, error } = await this.db
      .from('admin_regions')
      .insert([
        {
          admin_id: adminId,
          region_type: regionType,
          region_id: regionId,
          assigned_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('Error assigning admin:', error)
      throw new DatabaseError('Failed to assign admin', 'ASSIGN_ADMIN_ERROR', error)
    }

    return assignment?.[0] as AdminAssignment
  }

  async removeAdminFromRegion(adminRegionId: number): Promise<void> {
    // Delete assignment
    const { error } = await this.db
      .from('admin_regions')
      .delete()
      .eq('id', adminRegionId)

    if (error) {
      console.error('Error removing admin:', error)
      throw new DatabaseError('Failed to remove admin', 'REMOVE_ADMIN_ERROR', error)
    }
  }
}
