import { NextRequest, NextResponse } from 'next/server'
import { getCallerFromRequest } from '@/lib/server/session'

export async function GET(request: NextRequest) {
  const caller = await getCallerFromRequest(request)
  if (!caller) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return NextResponse.json({
    success: true,
    caller: {
      id: caller.id,
      role_name: caller.role_name,
      hierarchy_level: caller.hierarchy_level,
      palika_id: caller.palika_id,
      district_id: caller.district_id,
      province_id: caller.province_id,
      permissions: caller.permissions,
    },
  })
}
