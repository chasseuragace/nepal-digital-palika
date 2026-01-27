import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

interface CreateAdminRequest {
  email: string
  full_name: string
  role: string
  hierarchy_level: 'national' | 'province' | 'district' | 'palika'
  province_id?: number | null
  district_id?: number | null
  palika_id?: number | null
  regions?: Array<{ region_type: 'province' | 'district' | 'palika'; region_id: number }>
}

interface CreateAdminResponse {
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
    regions: Array<{ id: number; region_type: string; region_id: number }>
  }
  error?: string
}

/**
 * Validates the hierarchy configuration for admin creation
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

export async function POST(request: NextRequest): Promise<NextResponse<CreateAdminResponse>> {
  try {
    const body: CreateAdminRequest = await request.json()

    // Validate required fields
    if (!body.email || !body.full_name || !body.role || !body.hierarchy_level) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, full_name, role, hierarchy_level' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate hierarchy configuration
    const hierarchyValidation = validateHierarchyConfiguration(
      body.hierarchy_level,
      body.province_id,
      body.district_id,
      body.palika_id,
      body.regions
    )

    if (!hierarchyValidation.valid) {
      return NextResponse.json(
        { success: false, error: hierarchyValidation.error },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', body.email)
      .single()

    if (existingAdmin) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 409 }
      )
    }

    // Create auth user with temporary password
    const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!'
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Create admin_users record
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        id: authUser.user.id,
        email: body.email,
        full_name: body.full_name,
        role: body.role,
        hierarchy_level: body.hierarchy_level,
        province_id: body.province_id || null,
        district_id: body.district_id || null,
        palika_id: body.palika_id || null,
        is_active: true
      })
      .select()
      .single()

    if (adminError) {
      console.error('Admin creation error:', adminError)
      // Clean up auth user if admin creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { success: false, error: 'Failed to create admin user' },
        { status: 500 }
      )
    }

    // Create admin_regions records
    const adminRegions = []
    if (body.regions && body.regions.length > 0) {
      const { data: regions, error: regionsError } = await supabaseAdmin
        .from('admin_regions')
        .insert(
          body.regions.map(r => ({
            admin_id: admin.id,
            region_type: r.region_type,
            region_id: r.region_id
          }))
        )
        .select()

      if (regionsError) {
        console.error('Admin regions creation error:', regionsError)
        // Clean up admin and auth user if regions creation fails
        await supabaseAdmin.from('admin_users').delete().eq('id', admin.id)
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return NextResponse.json(
          { success: false, error: 'Failed to create admin regions' },
          { status: 500 }
        )
      }

      adminRegions.push(...regions)
    }

    return NextResponse.json(
      {
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
          regions: adminRegions.map(r => ({
            id: r.id,
            region_type: r.region_type,
            region_id: r.region_id
          }))
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating admin:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
