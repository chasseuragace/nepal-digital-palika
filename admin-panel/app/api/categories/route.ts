import { NextRequest, NextResponse } from 'next/server'
import { getCategoriesDatasource } from '@/lib/categories-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entity_type')

    const categoriesDatasource = getCategoriesDatasource()

    const categories = await categoriesDatasource.getAll(
      entityType ? { entity_type: entityType } : undefined
    )

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}