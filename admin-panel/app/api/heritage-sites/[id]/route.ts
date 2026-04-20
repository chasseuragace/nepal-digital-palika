import { NextRequest, NextResponse } from 'next/server'
import { HeritageSitesService } from '@/services/heritage-sites.service'
import { getHeritageSitesDatasource } from '@/lib/heritage-sites-config'

const service = new HeritageSitesService(getHeritageSitesDatasource())

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await service.getById(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error fetching heritage site by id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const input = await req.json()
    const result = await service.update(params.id, input)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error updating heritage site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await service.delete(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error('Error deleting heritage site:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
