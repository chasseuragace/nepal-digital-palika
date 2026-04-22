import { NextResponse, NextRequest } from 'next/server'
import { getRegionsDatasource } from '@/lib/regions-config'
import { ValidationError, DatabaseError } from '@/lib/datasource-errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { adminId, regionType, regionId } = body

    if (!adminId || !regionType || !regionId) {
      return NextResponse.json(
        { error: 'adminId, regionType, and regionId are required' },
        { status: 400 }
      )
    }

    const datasource = getRegionsDatasource()

    try {
      const assignment = await datasource.assignAdminToRegion(adminId, regionType, regionId)
      return NextResponse.json({ data: assignment }, { status: 201 })
    } catch (error: any) {
      if (error instanceof ValidationError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 409 }
        )
      }
      if (error instanceof DatabaseError) {
        return NextResponse.json(
          { error: error.message, code: error.code },
          { status: 500 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Error assigning admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
