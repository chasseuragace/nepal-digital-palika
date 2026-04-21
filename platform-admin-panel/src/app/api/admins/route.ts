import { NextRequest, NextResponse } from 'next/server'
import { AdminsService } from '@/services/admins.service'

const service = new AdminsService()

export async function GET(_request: NextRequest) {
  const result = await service.getAll()
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }
  return NextResponse.json({ data: result.data }, { status: 200 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await service.create(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
    return NextResponse.json(
      { data: result.data, message: result.message },
      { status: 201 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create admin'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
