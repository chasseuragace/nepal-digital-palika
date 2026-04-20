import { NextRequest, NextResponse } from 'next/server'
import { MarketplaceProductsService } from '@/services/marketplace-products.service'
import { ProductFilters } from '@/lib/marketplace-products-datasource'

export async function GET(request: NextRequest) {
  try {
    const palikaId = request.nextUrl.searchParams.get('palika_id')

    if (!palikaId) {
      return NextResponse.json(
        { error: 'palika_id is required' },
        { status: 400 }
      )
    }

    // Parse filters from query params
    const filters: ProductFilters = {
      verificationStatus: (request.nextUrl.searchParams.get('verificationStatus') as any) || undefined,
      category: request.nextUrl.searchParams.get('category') || undefined,
      dateFrom: request.nextUrl.searchParams.get('dateFrom') || undefined,
      dateTo: request.nextUrl.searchParams.get('dateTo') || undefined,
      search: request.nextUrl.searchParams.get('search') || undefined,
      sort: (request.nextUrl.searchParams.get('sort') as any) || 'newest',
      page: parseInt(request.nextUrl.searchParams.get('page') || '1'),
      limit: parseInt(request.nextUrl.searchParams.get('limit') || '25')
    }

    const productsService = new MarketplaceProductsService()

    const result = await productsService.listProducts(parseInt(palikaId), filters)

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in GET /api/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
