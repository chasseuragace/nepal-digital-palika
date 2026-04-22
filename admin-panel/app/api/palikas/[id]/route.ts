import { NextRequest, NextResponse } from 'next/server'
import { getPalikasDatasource } from '@/lib/palikas-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)

    const datasource = getPalikasDatasource()
    const palika = await datasource.getPalikaById(id)

    if (!palika) {
      return NextResponse.json({ error: 'Palika not found' }, { status: 404 })
    }

    return NextResponse.json(palika)
  } catch (error) {
    console.error('Error fetching palika:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
