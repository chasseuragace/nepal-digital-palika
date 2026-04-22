import { NextRequest, NextResponse } from 'next/server'
import { getPalikasDatasource } from '@/lib/datasources/palikas-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ palikaId: string }> }
) {
  const { palikaId: palikaIdParam } = await params
  const palikaId = Number(palikaIdParam)

  if (isNaN(palikaId)) {
    return NextResponse.json({ error: 'Invalid palikaId' }, { status: 400 })
  }

  try {
    const datasource = getPalikasDatasource()
    const palika = await datasource.getById(palikaId)

    if (!palika) {
      return NextResponse.json({ error: 'Palika not found' }, { status: 404 })
    }

    return NextResponse.json({ data: palika })
  } catch (error) {
    console.error('Error fetching palika:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch palika' },
      { status: 500 }
    )
  }
}
