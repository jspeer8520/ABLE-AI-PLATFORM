import { authMiddleware } from '@able/auth'
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Apply auth middleware to all /api routes except health and webhooks
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/health') || pathname.startsWith('/api/webhooks')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    return authMiddleware(request)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
