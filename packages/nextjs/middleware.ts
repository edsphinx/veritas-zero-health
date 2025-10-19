/**
 * Next.js Middleware for Route Protection
 *
 * Protects routes based on authentication status and user roles
 * Runs on Edge Runtime for optimal performance
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@veritas/types';

// Define protected routes and their required roles
const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/patient': [UserRole.PATIENT],
  '/researcher': [UserRole.RESEARCHER],
  '/sponsor': [UserRole.SPONSOR],
  '/clinic': [UserRole.CLINIC],
  '/superadmin': [UserRole.SUPERADMIN],
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/studies', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes (except protected ones), and public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/dashi-logo.svg') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/api/auth') // NextAuth routes are public
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is authenticated
  if (!token) {
    // Redirect to home page if not authenticated
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check role-based permissions
  for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(route)) {
      const userRole = token.user?.role as UserRole;

      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to home if user doesn't have required role
        const url = request.nextUrl.clone();
        url.pathname = '/';
        url.searchParams.set('error', 'insufficient_permissions');
        return NextResponse.redirect(url);
      }
    }
  }

  return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
