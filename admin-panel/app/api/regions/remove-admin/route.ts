import { NextResponse, NextRequest } from 'next/server'
import { getRegionsDatasource } from '@/lib/regions-config'
import { DatabaseError } from '@/lib/datasource-errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminRegionId } = body

    if (!adminRegionId) {
      return NextResponse.json(
        { error: 'adminRegionId is required' },
        { status: 400 }
      )
    }

    const datasource = getRegionsDatasource()
    await datasource.removeAdminFromRegion(adminRegionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DatabaseError) {
      console.error('Database error removing admin:', error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }
    console.error('Error removing admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
