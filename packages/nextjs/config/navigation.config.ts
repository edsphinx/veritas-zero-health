/**
 * Navigation Configuration
 *
 * Centralized navigation structure for all portals.
 */

import { UserRole } from '@veritas/types';

export interface NavItem {
  label: string;
  href: string;
  icon?: string; // Lucide icon name
  badge?: string;
  roles?: UserRole[];
  external?: boolean;
  children?: NavItem[];
}

/**
 * Main Navigation Items (public)
 */
export const mainNavigation: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: 'Home',
  },
  {
    label: 'Studies',
    href: '/studies',
    icon: 'Beaker',
  },
  {
    label: 'About',
    href: '/about',
    icon: 'Info',
  },
];

/**
 * Patient Portal Navigation
 */
export const patientNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/patient',
    icon: 'LayoutDashboard',
    roles: [UserRole.PATIENT],
  },
  {
    label: 'Medical Records',
    href: '/patient/records',
    icon: 'FileText',
    roles: [UserRole.PATIENT],
  },
  {
    label: 'My Studies',
    href: '/patient/studies',
    icon: 'Microscope',
    roles: [UserRole.PATIENT],
  },
  {
    label: 'Health Identity',
    href: '/patient/identity',
    icon: 'Shield',
    roles: [UserRole.PATIENT],
  },
];

/**
 * Clinic Portal Navigation
 */
export const clinicNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/clinic',
    icon: 'LayoutDashboard',
    roles: [UserRole.CLINIC],
  },
  {
    label: 'Patients',
    href: '/clinic/patients',
    icon: 'Users',
    roles: [UserRole.CLINIC],
  },
  {
    label: 'Issue Vouchers',
    href: '/clinic/issue',
    icon: 'FileCheck',
    roles: [UserRole.CLINIC],
  },
  {
    label: 'Studies',
    href: '/clinic/studies',
    icon: 'Beaker',
    roles: [UserRole.CLINIC],
  },
];

/**
 * Sponsor Portal Navigation
 */
export const sponsorNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/sponsor',
    icon: 'LayoutDashboard',
    roles: [UserRole.SPONSOR],
  },
  {
    label: 'Fund Study',
    href: '/sponsor/fund',
    icon: 'DollarSign',
    roles: [UserRole.SPONSOR],
    badge: 'New',
  },
  {
    label: 'Funded Studies',
    href: '/sponsor/studies',
    icon: 'Beaker',
    roles: [UserRole.SPONSOR],
  },
];

/**
 * Researcher Portal Navigation
 */
export const researcherNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/researcher',
    icon: 'LayoutDashboard',
    roles: [UserRole.RESEARCHER],
  },
  {
    label: 'My Studies',
    href: '/researcher/studies',
    icon: 'Beaker',
    roles: [UserRole.RESEARCHER],
  },
  {
    label: 'Create Study',
    href: '/researcher/create-study',
    icon: 'Plus',
    roles: [UserRole.RESEARCHER],
    badge: 'New',
  },
];

/**
 * SuperAdmin Portal Navigation
 */
export const superAdminNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/superadmin',
    icon: 'LayoutDashboard',
    roles: [UserRole.SUPERADMIN],
  },
  {
    label: 'Users & Roles',
    href: '/superadmin/users',
    icon: 'UserCog',
    roles: [UserRole.SUPERADMIN],
  },
  {
    label: 'Contracts',
    href: '/superadmin/contracts',
    icon: 'FileCode',
    roles: [UserRole.SUPERADMIN],
  },
  {
    label: 'System',
    href: '/superadmin/system',
    icon: 'Settings',
    roles: [UserRole.SUPERADMIN],
  },
  {
    label: 'Analytics',
    href: '/superadmin/analytics',
    icon: 'BarChart3',
    roles: [UserRole.SUPERADMIN],
  },
  {
    label: 'Logs',
    href: '/superadmin/logs',
    icon: 'ScrollText',
    roles: [UserRole.SUPERADMIN],
  },
];

/**
 * Footer Navigation
 */
export const footerNavigation: NavItem[] = [
  {
    label: 'Documentation',
    href: '/docs',
    icon: 'Book',
  },
  {
    label: 'Privacy Policy',
    href: '/privacy',
    icon: 'Shield',
  },
  {
    label: 'Terms of Service',
    href: '/terms',
    icon: 'FileText',
  },
  {
    label: 'Support',
    href: '/support',
    icon: 'HelpCircle',
  },
  {
    label: 'GitHub',
    href: 'https://github.com/veritas-zero-health',
    icon: 'Github',
    external: true,
  },
];

/**
 * Get navigation items for a specific role
 */
export function getNavigationForRole(role: UserRole | null): NavItem[] {
  switch (role) {
    case UserRole.PATIENT:
      return patientNavigation;
    case UserRole.CLINIC:
      return clinicNavigation;
    case UserRole.RESEARCHER:
      return researcherNavigation;
    case UserRole.SPONSOR:
      return sponsorNavigation;
    case UserRole.SUPERADMIN:
      return superAdminNavigation;
    case UserRole.GUEST:
    default:
      return mainNavigation;
  }
}

/**
 * Get all portal navigation items
 */
export const portalNavigation: NavItem[] = [
  {
    label: 'Patient Portal',
    href: '/patient',
    icon: 'User',
    roles: [UserRole.PATIENT],
  },
  {
    label: 'Clinic Portal',
    href: '/clinic',
    icon: 'Hospital',
    roles: [UserRole.CLINIC],
  },
  {
    label: 'Researcher Portal',
    href: '/researcher',
    icon: 'Microscope',
    roles: [UserRole.RESEARCHER],
  },
  {
    label: 'Sponsor Portal',
    href: '/sponsor',
    icon: 'DollarSign',
    roles: [UserRole.SPONSOR],
  },
  {
    label: 'SuperAdmin Portal',
    href: '/superadmin',
    icon: 'ShieldAlert',
    roles: [UserRole.SUPERADMIN],
  },
];
