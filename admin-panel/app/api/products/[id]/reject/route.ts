import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createSupabaseClient } from '@/services/database-client'
import { MarketplaceProductsService } from '@/services/marketplace-products.service'
import { TierValidationService } from '@/services/tier-validation.service'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const palikaId = request.nextUrl.searchParams.get('palika_id')
    const adminId = request.nextUrl.searchParams.get('admin_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    if (!adminId) {
      return NextResponse.json(
        { error: 'admin_id is required' },
        { status: 400 }
      )
    }

    const db = createSupabaseClient(supabaseAdmin)
    const tierValidationService = new TierValidationService(db)

    // Check if palika can access rejection workflow
    const validationRes = await tierValidationService.validateProductRejection(
      parseInt(palikaId),
      params.id
    )

    if (validationRes.error) {
      return NextResponse.json(
        { error: validationRes.error },
        { status: validationRes.status }
      )
    }

    if (!validationRes.data?.canReject) {
      return NextResponse.json(
        { error: validationRes.data?.reason || 'Rejection not available for this tier' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      )
    }

    const productsService = new MarketplaceProductsService(db)
    const result = await productsService.rejectProduct(
      params.id,
      parseInt(palikaId),
      adminId,
      reason
    )

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in PUT /api/products/[id]/reject:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
