import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth-service'

/**
 * POST /api/auth/login
 * Authenticates admin user with email and password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticateAdmin(email, password)

    return NextResponse.json(
      { user },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.json(
      { error: message },
      { status: 401 }
    )
  }
}
