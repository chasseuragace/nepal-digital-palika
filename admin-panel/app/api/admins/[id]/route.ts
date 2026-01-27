import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface UpdateAdminRequest {
  full_name?: string
  hierarchy_level?: 'national' | 'province' | 'district' | 'palika'
  province_id?: number | null
  district_id?: number | null
  palika_id?: number | null
  regions?: Array<{ region_type: 'province' | 'district' | 'palika'; region_id: number }>
  is_active?: boolean
}

interface UpdateAdminResponse {
  success: boolean
  data?: {
    id: string
    email: string
    full_name: string
    role: string
    hierarchy_level: string
    province_id: number | null
    district_id: number | null
    palika_id: number | null
    is_active: boolean
    regions: Array<{ id: number; region_type: string; region_id: number }>
  }
  error?: string
}

/**
 * Validates the hierarchy configuration for admin editing
 */
function validateHierarchyConfiguration(
  hierarchyLevel: string,
  provinceId: number | null | undefined,
  districtId: number | null | undefined,
  palikaId: number | null | undefined,
  regions: Array<{ region_type: string; region_id: number }> | undefined
): { valid: boolean; error?: string } {
  // National level: no regions required
  if (hierarchyLevel === 'national') {
    if (provinceId || districtId || palikaId) {
      return { valid: false, error: 'National-level admins should not have province/district/palika assignments' }
    }
    if (regions && regions.length > 0) {
      return { valid: false, error: 'National-level admins should not have region assignments' }
    }
    return { valid: true }
  }

  // Province level: province_id required, regions with type 'province' required
  if (hierarchyLevel === 'province') {
    if (!provinceId) {
      return { valid: false, error: 'Province-level admins must have province_id' }
    }
    if (!regions || regions.length === 0) {
      return { valid: false, error: 'Province-level admins must have at least one region assignment' }
    }
    if (!regions.every(r => r.region_type === 'province')) {
      return { valid: false, error: 'Province-level admins can only be assigned to provinces' }
    }
    if (districtId || palikaId) {
      return { valid: false, error: 'Province-level admins should not have district/palika assignments' }
    }
    return { valid: true }
  }

  // District level: province_id and district_id required, regions with type 'district' required
  if (hierarchyLevel === 'district') {
    if (!provinceId || !districtId) {
      return { valid: false, error: 'District-level admins must have province_id and district_id' }
    }
    if (!regions || regions.length === 0) {
      return { valid: false, error: 'District-level admins must have at least one region assignment' }
    }
    if (!regions.every(r => r.region_type === 'district')) {
      return { valid: false, error: 'District-level admins can only be assigned to districts' }
    }
    if (palikaId) {
      return { valid: false, error: 'District-level admins should not have palika assignments' }
    }
    return { valid: true }
  }

  // Palika level: province_id, district_id, and palika_id required, regions with type 'palika' required
  if (hierarchyLevel === 'palika') {
    if (!provinceId || !districtId || !palikaId) {
      return { valid: false, error: 'Palika-level admins must have province_id, district_id, and palika_id' }
    }
    if (!regions || regions.length === 0) {
      return { valid: false, error: 'Palika-level admins must have at least one region assignment' }
    }
    if (!regions.every(r => r.region_type === 'palika')) {
      return { valid: false, error: 'Palika-level admins can only be assigned to palikas' }
    }
    return { valid: true }
  }

  return { valid: false, error: 'Invalid hierarchy_level' }
}

/**
 * GET /api/admins/[id]
 * Fetch a specific admin with their regions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateAdminResponse>> {
  try {
    const adminId = params.id

    // Fetch admin with regions
    const { data: admin, error } = await supabaseAdmin
      .from('admin_users')
      .select(`
        id,
        email,
        full_name,
        role,
        hierarchy_level,
        province_id,
        district_id,
        palika_id,
        is_active,
        created_at,
        updated_at,
        admin_regions(
          id,
          region_type,
          region_id,
          assigned_at
        )
      `)
      .eq('id', adminId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admin' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        hierarchy_level: admin.hierarchy_level,
        province_id: admin.province_id,
        district_id: admin.district_id,
        palika_id: admin.palika_id,
        is_active: admin.is_active,
        regions: (admin.admin_regions || []).map(r => ({
          id: r.id,
          region_type: r.region_type,
          region_id: r.region_id
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching admin:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admins/[id]
 * Update an admin's hierarchy_level and region assignments
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<UpdateAdminResponse>> {
  try {
    const adminId = params.id
    const body: UpdateAdminRequest = await request.json()

    // Fetch existing admin
    const { data: existingAdmin, error: fetchError } = await supabaseAdmin
      .from('admin_users')
      .select('*')
      .eq('id', adminId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Admin not found' },
          { status: 404 }
        )
      }
      console.error('Supabase error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch admin' },
        { status: 500 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (body.full_name !== undefined) {
      updateData.full_name = body.full_name
    }

    if (body.hierarchy_level !== undefined) {
      updateData.hierarchy_level = body.hierarchy_level
    }

    if (body.province_id !== undefined) {
      updateData.province_id = body.province_id
    }

    if (body.district_id !== undefined) {
      updateData.district_id = body.district_id
    }

    if (body.palika_id !== undefined) {
      updateData.palika_id = body.palika_id
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }

    // If hierarchy_level is being changed, validate the new configuration
    if (body.hierarchy_level !== undefined) {
      const hierarchyValidation = validateHierarchyConfiguration(
        body.hierarchy_level,
        body.province_id !== undefined ? body.province_id : existingAdmin.province_id,
        body.district_id !== undefined ? body.district_id : existingAdmin.district_id,
        body.palika_id !== undefined ? body.palika_id : existingAdmin.palika_id,
        body.regions
      )

      if (!hierarchyValidation.valid) {
        return NextResponse.json(
          { success: false, error: hierarchyValidation.error },
          { status: 400 }
        )
      }
    }

    // Update admin_users record
    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from('admin_users')
      .update(updateData)
      .eq('id', adminId)
      .select()
      .single()

    if (updateError) {
      console.error('Admin update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update admin' },
        { status: 500 }
      )
    }

    // Handle region updates if provided
    let adminRegions = []
    if (body.regions !== undefined) {
      // Delete old admin_regions records
      const { error: deleteError } = await supabaseAdmin
        .from('admin_regions')
        .delete()
        .eq('admin_id', adminId)

      if (deleteError) {
        console.error('Admin regions deletion error:', deleteError)
        return NextResponse.json(
          { success: false, error: 'Failed to update admin regions' },
          { status: 500 }
        )
      }

      // Create new admin_regions records
      if (body.regions.length > 0) {
        const { data: regions, error: regionsError } = await supabaseAdmin
          .from('admin_regions')
          .insert(
            body.regions.map(r => ({
              admin_id: adminId,
              region_type: r.region_type,
              region_id: r.region_id
            }))
          )
          .select()

        if (regionsError) {
          console.error('Admin regions creation error:', regionsError)
          return NextResponse.json(
            { success: false, error: 'Failed to create admin regions' },
            { status: 500 }
          )
        }

        adminRegions = regions
      }
    } else {
      // Fetch existing regions if not updating them
      const { data: regions } = await supabaseAdmin
        .from('admin_regions')
        .select('*')
        .eq('admin_id', adminId)

      adminRegions = regions || []
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        full_name: updatedAdmin.full_name,
        role: updatedAdmin.role,
        hierarchy_level: updatedAdmin.hierarchy_level,
        province_id: updatedAdmin.province_id,
        district_id: updatedAdmin.district_id,
        palika_id: updatedAdmin.palika_id,
        is_active: updatedAdmin.is_active,
        regions: adminRegions.map(r => ({
          id: r.id,
          region_type: r.region_type,
          region_id: r.region_id
        }))
      }
    })
  } catch (error) {
    console.error('Error updating admin:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
