import { NextRequest, NextResponse } from 'next/server'
import { AdminsService } from '@/services/admins.service'

const service = new AdminsService()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await service.getById(id)
  if (!result.success) {
    const status = result.error === 'Admin ID is required' ? 400 : 500
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ data: result.data }, { status: 200 })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await service.delete(id)
  if (!result.success) {
    const status = result.error === 'Admin ID is required' ? 400 : 400
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ message: result.message }, { status: 200 })
}
