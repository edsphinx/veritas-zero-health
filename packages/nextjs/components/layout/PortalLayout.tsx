/**
 * PortalLayout Component
 *
 * Unified layout for all portal dashboards (Patient, Clinic, Researcher, Admin).
 * Automatically handles authentication, navigation, and responsive design.
 *
 * @example
 * ```tsx
 * // In patient dashboard
 * <PortalLayout
 *   requireAuth
 *   requireVerification
 *   allowedRoles={[UserRole.PATIENT]}
 * >
 *   <PatientDashboardContent />
 * </PortalLayout>
 * ```
 */

'use client';

import { ReactNode } from 'react';
import { RouteGuard, RouteGuardProps } from '@/components/auth/RouteGuard';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { DashboardSidebar } from './DashboardSidebar';
import { cn } from '@/shared/lib/utils';
import { getPortalConfig } from '@/shared/lib/auth/role-config';

export interface PortalLayoutProps extends Omit<RouteGuardProps, 'children'> {
  children: ReactNode;

  /** Show footer (default: true) */
  showFooter?: boolean;

  /** Full width layout (no container) */
  fullWidth?: boolean;

  /** Custom background */
  background?: 'default' | 'gradient' | 'none';

  /** Show sidebar (hybrid approach - for complex dashboards) */
  showSidebar?: boolean;

  /** Sidebar initially collapsed */
  sidebarCollapsed?: boolean;
}

/**
 * Main Portal Layout
 *
 * Wraps content with header, optional sidebar, footer, and authentication guard.
 * Implements the hybrid approach: top nav + optional sidebar for complex dashboards.
 */
export function PortalLayout({
  children,
  showFooter = true,
  fullWidth = false,
  background = 'default',
  showSidebar = false,
  sidebarCollapsed = false,
  ...guardProps
}: PortalLayoutProps) {
  return (
    <RouteGuard {...guardProps}>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <AppHeader />

        {/* Main Content with Optional Sidebar */}
        <div className="flex flex-1">
          {/* Sidebar (if enabled) */}
          {showSidebar && <DashboardSidebar defaultCollapsed={sidebarCollapsed} />}

          {/* Content Area */}
          <main
            className={cn(
              'flex-1',
              background === 'gradient'
                ? 'bg-gradient-to-br from-background via-background to-muted/20'
                : background === 'none'
                ? ''
                : 'bg-background'
            )}
          >
            {fullWidth ? (
              children
            ) : (
              <div className="container mx-auto px-4 py-8">{children}</div>
            )}
          </main>
        </div>

        {/* Footer */}
        {showFooter && <AppFooter />}
      </div>
    </RouteGuard>
  );
}

/**
 * Pre-configured layouts for each portal
 * Uses centralized role configuration from role-config.ts
 */

export function PatientLayout({ children }: { children: ReactNode }) {
  const config = getPortalConfig('patient');
  if (!config) throw new Error('Patient portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
      background="gradient"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

export function ClinicLayout({ children }: { children: ReactNode }) {
  const config = getPortalConfig('clinic');
  if (!config) throw new Error('Clinic portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

export function ResearcherLayout({ children }: { children: ReactNode }) {
  const config = getPortalConfig('researcher');
  if (!config) throw new Error('Researcher portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

export function SponsorLayout({ children }: { children: ReactNode }) {
  const config = getPortalConfig('sponsor');
  if (!config) throw new Error('Sponsor portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const config = getPortalConfig('admin');
  if (!config) throw new Error('Admin portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
      background="default"
      showSidebar={true}
      sidebarCollapsed={false}
    >
      {children}
    </PortalLayout>
  );
}

export function SuperAdminLayout({ children }: { children: ReactNode}) {
  const config = getPortalConfig('superadmin');
  if (!config) throw new Error('SuperAdmin portal config not found');

  return (
    <PortalLayout
      requireAuth={config.requireAuth}
      requireVerification={config.requireVerification}
      allowedRoles={config.allowedRoles}
      requiredPermissions={config.requiredPermissions}
      redirectTo={config.redirectOnDenied}
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
  fullWidth = false,
  background = 'gradient',
}: {
  children: ReactNode;
  showFooter?: boolean;
  fullWidth?: boolean;
  background?: 'default' | 'gradient' | 'none';
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main
        className={
          background === 'gradient'
            ? 'flex-1 bg-gradient-to-br from-background via-background to-muted/20'
            : background === 'none'
            ? 'flex-1'
            : 'flex-1 bg-background'
        }
      >
        {fullWidth ? (
          children
        ) : (
          <div className="container mx-auto px-4 py-8">{children}</div>
        )}
      </main>
      {showFooter && <AppFooter />}
    </div>
  );
}
