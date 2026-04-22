import { NextRequest, NextResponse } from 'next/server'
import { getServiceProvidersDatasource } from '@/lib/service-providers-config'
import type { CreateServiceProviderInput } from '@/services/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasource = getServiceProvidersDatasource()
    const data = await datasource.getById(params.id)

    if (!data) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching service provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const updateData: Partial<CreateServiceProviderInput> = {
      palika_id: body.palika_id,
      name_en: body.name_en,
      name_ne: body.name_ne,
      service_type: body.service_type,
      phone: body.phone,
      email: body.email,
      secondary_phones: body.secondary_phones,
      latitude: body.latitude,
      longitude: body.longitude,
      address: body.address,
      ward_number: body.ward_number,
      coverage_area: body.coverage_area,
      vehicle_count: body.vehicle_count,
      services: body.services,
      is_24_7: body.is_24_7,
    }

    const datasource = getServiceProvidersDatasource()
    const data = await datasource.update(params.id, updateData)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating service provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const datasource = getServiceProvidersDatasource()
    await datasource.update(params.id, { is_active: false } as any)

    return NextResponse.json({ message: 'Service provider deactivated' })
  } catch (error) {
    console.error('Error deactivating service provider:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
