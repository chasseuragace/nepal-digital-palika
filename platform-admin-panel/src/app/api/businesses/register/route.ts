/**
 * POST /api/businesses/register
 * Create new business registration (citizen self-service)
 * Tier-gated: Only available if palika has 'self_service_registration' feature
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { palikaHasFeature } from '@/lib/tier-utils'

interface BusinessRegistrationRequest {
  palika_id: number
  business_name: string
  business_name_ne?: string
  business_type?: string
  category?: string
  entity_type?: string
  contact_phone: string
  contact_email?: string
  contact_website?: string
  address: string
  ward_number?: number
  coordinates?: { lat: number; lng: number }
  description?: string
  description_ne?: string
  operating_hours?: Record<string, string>
  is_24_7?: boolean
  languages_spoken?: string[]
  price_range?: { min: number; max: number }
  facilities?: Record<string, boolean>
  owner_info?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: BusinessRegistrationRequest = await request.json()

    // Validate required fields
    if (!body.palika_id || !body.business_name || !body.contact_phone || !body.address) {
      return NextResponse.json(
        {
          error: 'Missing required fields: palika_id, business_name, contact_phone, address',
        },
        { status: 400 }
      )
    }

    // Check if palika has self-service registration feature enabled
    const hasSelfServiceFeature = await palikaHasFeature(
      body.palika_id,
      'self_service_registration'
    )

    if (!hasSelfServiceFeature) {
      return NextResponse.json(
        {
          error:
            'Self-service business registration is not available for this Palika. Please contact your Palika administration.',
        },
        { status: 403 }
      )
    }

    // Check if verification workflow is enabled (determines initial status)
    const hasVerificationWorkflow = await palikaHasFeature(
      body.palika_id,
      'verification_workflow'
    )

    // Determine initial status based on tier features
    const status = hasVerificationWorkflow ? 'pending_review' : 'draft'
    const isPublished = !hasVerificationWorkflow // Auto-publish if no verification workflow

    // Create location geometry if coordinates provided
    let locationGeometry = null
    if (body.coordinates?.lat && body.coordinates?.lng) {
      locationGeometry = `POINT(${body.coordinates.lng} ${body.coordinates.lat})`
    }

    // Create business record
    const { data, error } = await supabase.from('businesses').insert([
      {
        palika_id: body.palika_id,
        owner_user_id: null, // Will be set by RLS if auth is implemented
        business_name: body.business_name,
        business_name_ne: body.business_name_ne || null,
        business_type: body.business_type || null,
        category: body.category || null,
        entity_type: body.entity_type || null,
        contact_phone: body.contact_phone,
        contact_email: body.contact_email || null,
        contact_website: body.contact_website || null,
        address: body.address,
        ward_number: body.ward_number || null,
        coordinates: body.coordinates ? JSON.stringify(body.coordinates) : null,
        description: body.description || null,
        description_ne: body.description_ne || null,
        operating_hours: body.operating_hours ? JSON.stringify(body.operating_hours) : null,
        is_24_7: body.is_24_7 || false,
        languages_spoken: body.languages_spoken || [],
        price_range: body.price_range ? JSON.stringify(body.price_range) : null,
        facilities: body.facilities ? JSON.stringify(body.facilities) : null,
        owner_info: body.owner_info ? JSON.stringify(body.owner_info) : null,
        status,
        verification_status: 'pending',
        is_published: isPublished,
        is_featured: false,
        view_count: 0,
      },
    ])

    if (error) {
      console.error('Error creating business:', error)
      return NextResponse.json(
        { error: 'Failed to create business registration' },
        { status: 500 }
      )
    }

    const businessId = data?.[0]?.id

    return NextResponse.json(
      {
        success: true,
        data: {
          business_id: businessId,
          verification_status: status,
          is_published: isPublished,
          message: hasVerificationWorkflow
            ? 'Your business has been submitted for review. You will be notified when it is approved.'
            : 'Your business has been registered successfully!',
          next_steps: hasVerificationWorkflow
            ? 'Your submission is under review by Palika staff. This usually takes 3-5 business days.'
            : 'Your business is now visible on the marketplace. You can manage it from your dashboard.',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error in POST /api/businesses/register:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
