import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminToken = cookieStore.get('admin-token')?.value

    // 管理者トークンの確認
    const isAdmin = adminToken === process.env.ADMIN_TOKEN

    return NextResponse.json({
      isAdmin,
      status: isAdmin ? 'authenticated' : 'unauthenticated'
    })
  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json({
      isAdmin: false,
      status: 'error',
      error: 'Authentication check failed'
    }, { status: 500 })
  }
}