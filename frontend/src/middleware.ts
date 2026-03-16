import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = [
  '/dashboard',
  '/impulse',
  '/analysis',
  '/profile',
  '/onboarding',
];

const authPaths = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // We can't read JS memory tokens from middleware, so we check for
  // the refresh token cookie/header presence as a lightweight gate.
  // The real guard is the client-side ProtectedRoute component.
  // This middleware provides an additional layer for SSR redirects.

  const hasRefreshToken = request.cookies.has('hasSession');

  // Redirect authenticated users away from auth pages
  if (authPaths.some((p) => pathname.startsWith(p)) && hasRefreshToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/impulse/:path*',
    '/analysis/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/login',
    '/register',
  ],
};
