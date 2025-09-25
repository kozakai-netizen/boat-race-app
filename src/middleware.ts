import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Admin routes protection
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminToken = request.cookies.get('admin-token')?.value
    const validToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin123'

    // If no token or invalid token, redirect to login
    if (!adminToken || adminToken !== validToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}