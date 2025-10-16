/**
 * Centralized Role Configuration
 *
 * Single source of truth for all role-based access control.
 * All layouts, route guards, and permissions should reference this file.
 */

import { UserRole, Permission } from '@/shared/types/auth.types';

/**
 * Portal Access Configuration
 * Defines authentication and authorization requirements for each portal
 */
export interface PortalConfig {
  /** Portal identifier */
  portal: string;

  /** Allowed roles for this portal */
  allowedRoles: UserRole[];

  /** Require wallet connection */
  requireAuth: boolean;

  /** Require Gitcoin Passport verification */
  requireVerification: boolean;

  /** Required permissions (all must be satisfied) */
  requiredPermissions?: Permission[];

  /** Redirect path if access is denied */
  redirectOnDenied?: string;
}

/**
 * Centralized Portal Configurations
 */
export const PORTAL_CONFIGS: Record<string, PortalConfig> = {
  // Patient Portal
  patient: {
    portal: 'patient',
    allowedRoles: [UserRole.PATIENT],
    requireAuth: true,
    requireVerification: false, // Can be enabled when Gitcoin Passport is integrated
    redirectOnDenied: '/',
  },

  // Clinic Portal
  clinic: {
    portal: 'clinic',
    allowedRoles: [UserRole.CLINIC],
    requireAuth: true,
    requireVerification: false,
    redirectOnDenied: '/',
  },

  // Researcher Portal
  researcher: {
    portal: 'researcher',
    allowedRoles: [UserRole.RESEARCHER],
    requireAuth: true,
    requireVerification: false,
    redirectOnDenied: '/',
  },

  // Sponsor Portal
  sponsor: {
    portal: 'sponsor',
    allowedRoles: [UserRole.SPONSOR],
    requireAuth: true,
    requireVerification: false,
    redirectOnDenied: '/',
  },

  // Admin Portal
  admin: {
    portal: 'admin',
    allowedRoles: [UserRole.ADMIN],
    requireAuth: true,
    requireVerification: false,
    redirectOnDenied: '/',
  },

  // SuperAdmin Portal
  superadmin: {
    portal: 'superadmin',
    allowedRoles: [UserRole.SUPERADMIN],
    requireAuth: true,
    requireVerification: false,
    redirectOnDenied: '/',
  },
};

/**
 * Get portal configuration by name
 */
export function getPortalConfig(portal: string): PortalConfig | null {
  return PORTAL_CONFIGS[portal] || null;
}

/**
 * Get portal configuration by role
 */
export function getPortalConfigByRole(role: UserRole): PortalConfig | null {
  return Object.values(PORTAL_CONFIGS).find((config) =>
    config.allowedRoles.includes(role)
  ) || null;
}

/**
 * Check if a role has access to a portal
 */
export function canRoleAccessPortal(role: UserRole, portal: string): boolean {
  const config = getPortalConfig(portal);
  if (!config) return false;
  return config.allowedRoles.includes(role);
}

/**
 * Get default portal path for a role
 */
export function getDefaultPortalPath(role: UserRole): string {
  const portalMap: Record<UserRole, string> = {
    [UserRole.PATIENT]: '/patient',
    [UserRole.CLINIC]: '/clinic',
    [UserRole.RESEARCHER]: '/researcher',
    [UserRole.SPONSOR]: '/sponsor',
    [UserRole.ADMIN]: '/admin',
    [UserRole.SUPERADMIN]: '/superadmin',
    [UserRole.GUEST]: '/',
  };

  return portalMap[role] || '/';
}

/**
 * Role Display Names (for UI)
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'Patient',
  [UserRole.CLINIC]: 'Clinic',
  [UserRole.RESEARCHER]: 'Researcher',
  [UserRole.SPONSOR]: 'Sponsor',
  [UserRole.ADMIN]: 'Admin',
  [UserRole.SUPERADMIN]: 'SuperAdmin',
  [UserRole.GUEST]: 'Guest',
};

/**
 * Get display name for role
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || 'Unknown';
}
