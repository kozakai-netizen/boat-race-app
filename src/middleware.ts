import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Admin routes protection - TEMPORARILY DISABLED for development
  // TODO: Re-enable authentication later

  // const adminToken = request.cookies.get('admin-token')?.value
  // const validToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin123'
  //
  // if (!adminToken || adminToken !== validToken) {
  //   return NextResponse.redirect(new URL('/admin/login', request.url))
  // }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin',
    '/admin/races/:path*',
    '/admin/players/:path*',
    '/admin/results/:path*',
    '/admin/photos/:path*',
    '/admin/import/:path*'
  ]
}