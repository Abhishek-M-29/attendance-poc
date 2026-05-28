import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from './lib/supabase';

export default async function proxy(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Redirect to login if not authenticated and trying to access a protected route
  if (!session && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If authenticated, check role and redirect to appropriate dashboard
  if (session && pathname === '/login') {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const {
        data: profile,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // Redirect based on role
      if (profile && profile.role === 'super_admin') {
        return NextResponse.redirect(new URL('/dashboard/admin', request.url));
      }
      if (profile && profile.role === 'faculty') {
        return NextResponse.redirect(new URL('/dashboard/faculty', request.url));
      }
      if (profile && profile.role === 'student') {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};