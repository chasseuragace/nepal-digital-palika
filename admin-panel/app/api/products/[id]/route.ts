import { NextRequest, NextResponse } from 'next/server'
import { MarketplaceProductsService } from '@/services/marketplace-products.service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const palikaId = request.nextUrl.searchParams.get('palika_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    const productsService = new MarketplaceProductsService()

    const result = await productsService.getProductDetails(params.id, parseInt(palikaId))

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
