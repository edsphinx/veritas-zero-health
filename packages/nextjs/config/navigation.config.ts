/**
 * Navigation Configuration
 *
 * Centralized navigation structure for all portals.
 * Update this file to modify navigation across the entire app.
 */

import { UserRole, Permission } from '@/shared/types/auth.types';
import type { NavItem } from '@/shared/types/auth.types';

/**
 * Main Navigation Items
 * These appear in the top navbar for all users
 */
export const mainNavigation: NavItem[] = [
  {
    label: 'Home',
    href: '/',
    icon: 'Home',
  },
  {
    label: 'Trials',
    href: '/trials',
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
    permissions: [Permission.VIEW_OWN_RECORDS],
  },
  {
    label: 'My Trials',
    href: '/patient/trials',
    icon: 'Microscope',
    roles: [UserRole.PATIENT],
  },
  {
    label: 'Appointments',
    href: '/patient/appointments',
    icon: 'Calendar',
    roles: [UserRole.PATIENT],
  },
  {
    label: 'Privacy Settings',
    href: '/patient/privacy',
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
    permissions: [Permission.VIEW_PATIENTS],
  },
  {
    label: 'Appointments',
    href: '/clinic/appointments',
    icon: 'Calendar',
    roles: [UserRole.CLINIC],
    permissions: [Permission.SCHEDULE_APPOINTMENTS],
  },
  {
    label: 'Records',
    href: '/clinic/records',
    icon: 'FileText',
    roles: [UserRole.CLINIC],
    permissions: [Permission.CREATE_RECORDS],
  },
  {
    label: 'Schedule',
    href: '/clinic/schedule',
    icon: 'Clock',
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
    label: 'Funded Studies',
    href: '/sponsor/studies',
    icon: 'Beaker',
    roles: [UserRole.SPONSOR],
    permissions: [Permission.VIEW_FUNDED_STUDIES],
  },
  {
    label: 'Fund Study',
    href: '/sponsor/fund',
    icon: 'DollarSign',
    roles: [UserRole.SPONSOR],
    permissions: [Permission.FUND_STUDIES],
    badge: 'New',
  },
  {
    label: 'Funding History',
    href: '/sponsor/history',
    icon: 'History',
    roles: [UserRole.SPONSOR],
    permissions: [Permission.MANAGE_FUNDING],
  },
  {
    label: 'Analytics',
    href: '/sponsor/analytics',
    icon: 'BarChart3',
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
    permissions: [Permission.MANAGE_STUDIES],
  },
  {
    label: 'Applications',
    href: '/researcher/applications',
    icon: 'Users',
    roles: [UserRole.RESEARCHER],
    permissions: [Permission.VIEW_APPLICATIONS],
  },
  {
    label: 'Create Study',
    href: '/researcher/studies/create',
    icon: 'Plus',
    roles: [UserRole.RESEARCHER],
    permissions: [Permission.CREATE_STUDIES],
    badge: 'New',
  },
  {
    label: 'Analytics',
    href: '/researcher/analytics',
    icon: 'BarChart3',
    roles: [UserRole.RESEARCHER],
  },
];

/**
 * Admin Portal Navigation
 */
export const adminNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: 'Users',
    roles: [UserRole.ADMIN],
    permissions: [Permission.MANAGE_USERS],
  },
  {
    label: 'System',
    href: '/admin/system',
    icon: 'Settings',
    roles: [UserRole.ADMIN],
    permissions: [Permission.SYSTEM_CONFIG],
    children: [
      {
        label: 'Configuration',
        href: '/admin/system/config',
        icon: 'Sliders',
      },
      {
        label: 'Contracts',
        href: '/admin/system/contracts',
        icon: 'FileCode',
      },
      {
        label: 'Logs',
        href: '/admin/system/logs',
        icon: 'Terminal',
      },
    ],
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: 'TrendingUp',
    roles: [UserRole.ADMIN],
    permissions: [Permission.VIEW_ANALYTICS],
  },
  {
    label: 'Verification',
    href: '/admin/verification',
    icon: 'BadgeCheck',
    roles: [UserRole.ADMIN],
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
    label: 'Role Management',
    href: '/superadmin/roles',
    icon: 'UserCog',
    roles: [UserRole.SUPERADMIN],
    permissions: [Permission.ASSIGN_ROLES],
    badge: 'Core',
  },
  {
    label: 'Users & Wallets',
    href: '/superadmin/users',
    icon: 'Users',
    roles: [UserRole.SUPERADMIN],
    permissions: [Permission.MANAGE_USERS],
  },
  {
    label: 'Contracts',
    href: '/superadmin/contracts',
    icon: 'FileCode',
    roles: [UserRole.SUPERADMIN],
    permissions: [Permission.MANAGE_CONTRACTS],
    children: [
      {
        label: 'Health Identity SBT',
        href: '/superadmin/contracts/health-identity',
        icon: 'Shield',
      },
      {
        label: 'Studies & Escrow',
        href: '/superadmin/contracts/studies',
        icon: 'Beaker',
      },
      {
        label: 'Deployed Contracts',
        href: '/superadmin/contracts/deployed',
        icon: 'Database',
      },
    ],
  },
  {
    label: 'System Config',
    href: '/superadmin/system',
    icon: 'Settings',
    roles: [UserRole.SUPERADMIN],
    permissions: [Permission.SYSTEM_ADMIN],
    children: [
      {
        label: 'Network Settings',
        href: '/superadmin/system/network',
        icon: 'Network',
      },
      {
        label: 'Environment',
        href: '/superadmin/system/environment',
        icon: 'Server',
      },
      {
        label: 'Permissions',
        href: '/superadmin/system/permissions',
        icon: 'Key',
      },
    ],
  },
  {
    label: 'Analytics',
    href: '/superadmin/analytics',
    icon: 'BarChart3',
    roles: [UserRole.SUPERADMIN],
    permissions: [Permission.VIEW_ANALYTICS],
  },
  {
    label: 'Audit Logs',
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
export function getNavigationForRole(role: UserRole): NavItem[] {
  switch (role) {
    case UserRole.PATIENT:
      return patientNavigation;
    case UserRole.CLINIC:
      return clinicNavigation;
    case UserRole.RESEARCHER:
      return researcherNavigation;
    case UserRole.SPONSOR:
      return sponsorNavigation;
    case UserRole.ADMIN:
      return adminNavigation;
    case UserRole.SUPERADMIN:
      return superAdminNavigation;
    case UserRole.GUEST:
    default:
      return mainNavigation;
  }
}

/**
 * Get all portal navigation items (for quick switcher)
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
    label: 'Admin Portal',
    href: '/admin',
    icon: 'Shield',
    roles: [UserRole.ADMIN],
  },
  {
    label: 'SuperAdmin Portal',
    href: '/superadmin',
    icon: 'ShieldAlert',
    roles: [UserRole.SUPERADMIN],
  },
];
