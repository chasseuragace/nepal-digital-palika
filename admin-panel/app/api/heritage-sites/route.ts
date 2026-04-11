import { NextRequest, NextResponse } from 'next/server'
import { HeritageSitesService } from '@/services/heritage-sites.service'
import { getHeritageSitesDatasource } from '@/lib/heritage-sites-config'

const service = new HeritageSitesService(getHeritageSitesDatasource())

export async function GET(req: NextRequest) {
  try {
    const filters: any = {}
    const { searchParams } = new URL(req.url)

    // Optional filters from query params
    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }
    if (searchParams.get('palika_id')) {
      filters.palika_id = parseInt(searchParams.get('palika_id') || '0')
    }
    if (searchParams.get('category_id')) {
      filters.category_id = parseInt(searchParams.get('category_id') || '0')
    }
    if (searchParams.get('heritage_status')) {
      filters.heritage_status = searchParams.get('heritage_status')
    }
    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await service.getAll(filters, { page, limit })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching heritage sites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = await req.json()
    const result = await service.create(input)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error creating heritage site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...input } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const result = await service.update(id, input)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating heritage site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const result = await service.delete(id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error('Error deleting heritage site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}