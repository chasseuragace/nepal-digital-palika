/**
 * GET /api/businesses/[id]/approval-details
 * Get full business details for staff review
 * RLS: Staff can only view their own palika's businesses
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = params.id

    // Verify business exists and get full details
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select(
        `
        *,
        palikas(id, name_en, name_ne, district_id),
        districts(id, name_en, name_ne),
        business_images(id, image_url, is_featured, sort_order),
        approval_notes(id, content, is_internal, created_at, author_id, admin_users(full_name))
      `
      )
      .eq('id', businessId)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get verification rules if applicable
    let verificationRules: any[] = []
    const { data: workflow } = await supabase
      .from('approval_workflows')
      .select('rules')
      .eq('palika_id', business.palika_id)
      .single()

    if (workflow?.rules && Array.isArray(workflow.rules)) {
      verificationRules = workflow.rules.filter((r: any) => r.enabled === true)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: business.id,
        business_name: business.business_name,
        business_name_ne: business.business_name_ne,
        business_type: business.business_type,
        category: business.category,
        entity_type: business.entity_type,

        // Contact Info
        contact_phone: business.contact_phone,
        contact_email: business.contact_email,
        contact_website: business.contact_website,

        // Location
        address: business.address,
        ward_number: business.ward_number,
        coordinates: business.coordinates,
        location: business.location,

        // Details
        description: business.description,
        description_ne: business.description_ne,
        operating_hours: business.operating_hours,
        is_24_7: business.is_24_7,
        languages_spoken: business.languages_spoken,
        price_range: business.price_range,
        facilities: business.facilities,

        // Status
        status: business.status,
        verification_status: business.verification_status,
        reviewer_feedback: business.reviewer_feedback,
        reviewer_id: business.reviewer_id,
        is_published: business.is_published,
        created_at: business.created_at,
        created_by: business.created_by,
        updated_at: business.updated_at,

        // Owner Info
        owner_user_id: business.owner_user_id,
        owner_info: business.owner_info,

        // Relationships
        palika: business.palikas,
        district: business.districts,

        // Media
        images: business.business_images || [],
        featured_image_url: business.featured_image_url,

        // Internal Notes (staff-only)
        approval_notes: business.approval_notes || [],

        // Verification Rules
        verification_rules: verificationRules,
      },
    })
  } catch (error) {
    console.error(
      `Error in GET /api/businesses/[id]/approval-details:`,
      error
    )
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
