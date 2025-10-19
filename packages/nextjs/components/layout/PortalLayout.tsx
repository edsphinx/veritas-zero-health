/**
 * PortalLayout Component
 *
 * Unified layout wrapper with header, sidebar, footer
 * Provides pre-configured layouts for each portal
 */

'use client';

import { ReactNode } from 'react';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { DashboardSidebar } from './DashboardSidebar';
import { RouteGuard, type RouteGuardProps } from '@/components/auth/RouteGuard';
import { UserRole } from '@veritas/types';
import { cn } from '@/lib/utils';

interface PortalLayoutProps extends Omit<RouteGuardProps, 'children'> {
  children: ReactNode;
  showFooter?: boolean;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  fullWidth?: boolean;
  background?: 'default' | 'muted' | 'accent';
}

export function PortalLayout({
  children,
  showFooter = true,
  showSidebar = false,
  sidebarCollapsed = false,
  fullWidth = false,
  background = 'default',
  ...guardProps
}: PortalLayoutProps) {
  const backgroundClasses = {
    default: 'bg-background',
    muted: 'bg-muted/30',
    accent: 'bg-accent/10',
  };

  return (
    <RouteGuard {...guardProps}>
      <div className="min-h-screen flex flex-col">
        <AppHeader />

        <div className="flex flex-1">
          {showSidebar && <DashboardSidebar defaultCollapsed={sidebarCollapsed} />}

          <main className={cn('flex-1', backgroundClasses[background])}>
            {fullWidth ? (
              children
            ) : (
              <div className="container mx-auto px-4 py-8">{children}</div>
            )}
          </main>
        </div>

        {showFooter && <AppFooter />}
      </div>
    </RouteGuard>
  );
}

/**
 * Pre-configured Patient Layout
 */
export function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout
      requireAuth={true}
      allowedRoles={[UserRole.PATIENT]}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

/**
 * Pre-configured Researcher Layout
 */
export function ResearcherLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout
      requireAuth={true}
      allowedRoles={[UserRole.RESEARCHER]}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

/**
 * Pre-configured Sponsor Layout
 */
export function SponsorLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout
      requireAuth={true}
      allowedRoles={[UserRole.SPONSOR]}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

/**
 * Pre-configured Clinic Layout
 */
export function ClinicLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout
      requireAuth={true}
      allowedRoles={[UserRole.CLINIC]}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

/**
 * Pre-configured SuperAdmin Layout
 */
export function SuperAdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalLayout
      requireAuth={true}
      allowedRoles={[UserRole.SUPERADMIN]}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

/**
 * Public Layout (no authentication required)
 */
export function PublicLayout({
  children,
  showFooter = true,
}: {
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    <PortalLayout
      requireAuth={false}
      background="default"
      showSidebar={false}
      showFooter={showFooter}
    >
      {children}
    </PortalLayout>
  );
}
