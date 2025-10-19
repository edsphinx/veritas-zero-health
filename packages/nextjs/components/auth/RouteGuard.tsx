'use client';

/**
 * RouteGuard Component
 *
 * Client-side route protection component
 * Wraps protected pages to ensure user has required authentication and roles
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@veritas/types';

export interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  fallbackUrl?: string;
}

export function RouteGuard({
  children,
  requireAuth = true,
  allowedRoles,
  fallbackUrl = '/',
}: RouteGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, hasAnyRole } = useAuth();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      router.push(fallbackUrl);
      return;
    }

    // Check role requirement
    if (allowedRoles && allowedRoles.length > 0 && user) {
      if (!hasAnyRole(allowedRoles)) {
        router.push(fallbackUrl);
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requireAuth, allowedRoles, hasAnyRole, router, fallbackUrl]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if auth check fails
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Don't render if role check fails
  if (allowedRoles && allowedRoles.length > 0 && user && !hasAnyRole(allowedRoles)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Convenience components for specific roles
 */

export function PatientGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={[UserRole.PATIENT]}>
      {children}
    </RouteGuard>
  );
}

export function ResearcherGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={[UserRole.RESEARCHER]}>
      {children}
    </RouteGuard>
  );
}

export function SponsorGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={[UserRole.SPONSOR]}>
      {children}
    </RouteGuard>
  );
}

export function ClinicGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={[UserRole.CLINIC]}>
      {children}
    </RouteGuard>
  );
}

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAuth allowedRoles={[UserRole.SUPERADMIN]}>
      {children}
    </RouteGuard>
  );
}
