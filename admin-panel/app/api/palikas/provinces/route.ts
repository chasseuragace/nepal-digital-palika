import { NextResponse } from 'next/server'
import { getPalikasDatasource } from '@/lib/palikas-config'

export async function GET() {
  try {
    const datasource = getPalikasDatasource()
    const provinces = await datasource.getProvinces()

    return NextResponse.json({ data: provinces })
  } catch (error) {
    console.error('Error fetching provinces:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
