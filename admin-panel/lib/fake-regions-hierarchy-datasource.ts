/**
 * Fake Regions Hierarchy Datasource
 */

import { IRegionsDatasource, ProvinceWithAdmins, AdminAssignment } from './regions-datasource'
import { getFakeProvinces, getFakeDistricts, getFakePalikas } from './fake-regions-datasource'

export class FakeRegionsHierarchyDatasource implements IRegionsDatasource {
  private adminAssignments: AdminAssignment[] = [
    {
      id: 1,
      admin_id: 'fake-admin-1',
      region_type: 'province',
      region_id: 3,
      assigned_at: new Date().toISOString(),
      admin_users: [{ id: 'fake-admin-1', full_name: 'Admin User', role: 'admin' }]
    }
  ]
  private nextAssignmentId = 2

  async getRegionHierarchy(): Promise<ProvinceWithAdmins[]> {
    await this.delay(100)

    const provinces = getFakeProvinces()
    const districts = getFakeDistricts()
    const palikas = getFakePalikas()

    // Build hierarchical structure
    const hierarchyData = provinces.map(province => ({
      ...province,
      type: 'province',
      admins: this.adminAssignments.filter(ar => ar.region_type === 'province' && ar.region_id === province.id),
      districts: districts
        .filter(d => d.province_id === province.id)
        .map(district => ({
          ...district,
          type: 'district',
          admins: this.adminAssignments.filter(ar => ar.region_type === 'district' && ar.region_id === district.id),
          palikas: palikas
            .filter(p => p.district_id === district.id)
            .map(palika => ({
              ...palika,
              type: 'palika',
              admins: this.adminAssignments.filter(ar => ar.region_type === 'palika' && ar.region_id === palika.id)
            }))
        }))
    }))

    return hierarchyData
  }

  async assignAdminToRegion(adminId: string, regionType: string, regionId: number): Promise<AdminAssignment> {
    await this.delay(50)

    // Check if assignment already exists
    const existing = this.adminAssignments.find(
      ar => ar.admin_id === adminId && ar.region_type === regionType && ar.region_id === regionId
    )

    if (existing) {
      throw new Error('Admin is already assigned to this region')
    }

    // Create assignment
    const assignment: AdminAssignment = {
      id: this.nextAssignmentId++,
      admin_id: adminId,
      region_type: regionType as any,
      region_id: regionId,
      assigned_at: new Date().toISOString(),
      admin_users: [{ id: adminId, full_name: 'Admin User', role: 'admin' }]
    }

    this.adminAssignments.push(assignment)
    return assignment
  }

  async removeAdminFromRegion(adminRegionId: number): Promise<void> {
    await this.delay(50)
    this.adminAssignments = this.adminAssignments.filter(ar => ar.id !== adminRegionId)
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
