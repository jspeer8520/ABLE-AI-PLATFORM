import { NextResponse } from 'next/server';
import { supabaseServer } from '@/supabase/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  const protectedPaths = ['/dashboard', '/billing', '/settings'];
  const pathname = req.nextUrl.pathname;

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/billing/:path*', '/settings/:path*'],
};
