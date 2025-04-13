import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminAuth = request.cookies.get('admin-auth');
  const isAdmin = adminAuth?.value === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  
  if (!isAdmin && !request.nextUrl.pathname.startsWith('/admin/login')) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
}; 