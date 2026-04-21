import { NextRequest, NextResponse } from 'next/server'
import { MarketplaceProductsService } from '@/services/marketplace-products.service'

/**
 * PUT /api/products/:id/reject
 *
 * Tier-based access check removed — tiers are metadata only. Scope
 * enforcement (product belongs to caller's palika) still happens inside
 * MarketplaceProductsService.
 */
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

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required' },
        { status: 400 }
      )
    }

    const productsService = new MarketplaceProductsService()
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
