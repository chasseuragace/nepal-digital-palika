import { NextRequest, NextResponse } from 'next/server'
import { getServiceProvidersDatasource } from '@/lib/service-providers-config'
import type { ServiceProviderFilters, CreateServiceProviderInput, PaginationParams } from '@/services/types'

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const palikaId = params.get('palika_id')
    const serviceType = params.get('service_type')
    const status = params.get('status')
    const search = params.get('search')
    const page = parseInt(params.get('page') || '1')
    const limit = parseInt(params.get('limit') || '25')

    const filters: ServiceProviderFilters = {}
    if (palikaId) filters.palika_id = parseInt(palikaId)
    if (serviceType) filters.service_type = serviceType
    if (status) filters.status = status
    else filters.is_active = true
    if (search) filters.search = search

    const pagination: PaginationParams = { page, limit }

    const datasource = getServiceProvidersDatasource()
    const result = await datasource.getAll(filters, pagination)

    return NextResponse.json({
      data: result.data,
      meta: { page: result.page, limit: result.limit, total: result.total, hasMore: result.hasMore }
    })
  } catch (error) {
    console.error('Error fetching service providers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const providerData: CreateServiceProviderInput = {
      palika_id: body.palika_id,
      name_en: body.name_en,
      name_ne: body.name_ne,
      service_type: body.service_type,
      phone: body.phone,
      email: body.email,
      secondary_phones: body.secondary_phones || [],
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      ward_number: body.ward_number,
      coverage_area: body.coverage_area,
      vehicle_count: body.vehicle_count || 1,
      services: body.services || [],
      is_24_7: body.is_24_7 ?? true,
    }

    const datasource = getServiceProvidersDatasource()
    const data = await datasource.create(providerData)

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating service provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
