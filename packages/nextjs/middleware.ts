/**
 * NextAuth Middleware for Route Protection
 *
 * Protects routes based on authentication status and user roles.
 * This runs on EVERY request at the edge.
 */

import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes (no auth required)
  const publicRoutes = [
    "/",
    "/api/auth",
    "/auth/error",
  ];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected routes - require authentication
  const protectedRoutes = {
    "/patient": ["patient"],
    "/clinic": ["clinic"],
    "/researcher": ["researcher"],
    "/superadmin": ["superadmin"],
  };

  // Check if route requires specific role
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      // Not authenticated - redirect to home
      if (!session?.user) {
        const url = req.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }

      // Check role access
      const userRole = session.user.role;
      if (!allowedRoles.includes(userRole)) {
        // User doesn't have required role - redirect to home
        const url = req.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  // Onboarding route - require auth but redirect if already verified
  if (pathname.startsWith("/onboarding")) {
    if (!session?.user) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // If already verified, redirect to appropriate dashboard
    if (session.user.isVerified) {
      const url = req.nextUrl.clone();
      const role = session.user.role;
      url.pathname = `/${role}`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
