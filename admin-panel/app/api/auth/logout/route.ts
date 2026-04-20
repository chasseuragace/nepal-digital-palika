import { NextResponse } from 'next/server'
import { clearedCookieHeader } from '@/lib/server/session'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.set('Set-Cookie', clearedCookieHeader())
  return response
}
