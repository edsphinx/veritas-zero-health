/**
 * Authentication & Authorization Types
 *
 * Defines user roles, permissions, and authentication state
 */

import { Address } from 'viem';

/**
 * User roles in the system
 */
export enum UserRole {
  PATIENT = 'patient',
  CLINIC = 'clinic',
  RESEARCHER = 'researcher',
  SPONSOR = 'sponsor',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
  GUEST = 'guest',
}

/**
 * Permission levels for features
 */
export enum Permission {
  // Patient permissions
  VIEW_OWN_RECORDS = 'view_own_records',
  MANAGE_OWN_DATA = 'manage_own_data',
  APPLY_TO_TRIALS = 'apply_to_trials',

  // Clinic permissions
  VIEW_PATIENTS = 'view_patients',
  CREATE_RECORDS = 'create_records',
  SCHEDULE_APPOINTMENTS = 'schedule_appointments',

  // Researcher permissions
  CREATE_STUDIES = 'create_studies',
  VIEW_APPLICATIONS = 'view_applications',
  MANAGE_STUDIES = 'manage_studies',

  // Sponsor permissions
  FUND_STUDIES = 'fund_studies',
  VIEW_FUNDED_STUDIES = 'view_funded_studies',
  MANAGE_FUNDING = 'manage_funding',

  // Admin permissions
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics',
  SYSTEM_CONFIG = 'system_config',

  // SuperAdmin permissions
  ASSIGN_ROLES = 'assign_roles',
  MANAGE_CONTRACTS = 'manage_contracts',
  SYSTEM_ADMIN = 'system_admin',
  MANAGE_ADMINS = 'manage_admins',
}

/**
 * Role-based permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.PATIENT]: [
    Permission.VIEW_OWN_RECORDS,
    Permission.MANAGE_OWN_DATA,
    Permission.APPLY_TO_TRIALS,
  ],
  [UserRole.CLINIC]: [
    Permission.VIEW_PATIENTS,
    Permission.CREATE_RECORDS,
    Permission.SCHEDULE_APPOINTMENTS,
  ],
  [UserRole.RESEARCHER]: [
    Permission.CREATE_STUDIES,
    Permission.VIEW_APPLICATIONS,
    Permission.MANAGE_STUDIES,
  ],
  [UserRole.SPONSOR]: [
    Permission.FUND_STUDIES,
    Permission.VIEW_FUNDED_STUDIES,
    Permission.MANAGE_FUNDING,
  ],
  [UserRole.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
    Permission.SYSTEM_CONFIG,
  ],
  [UserRole.SUPERADMIN]: [
    // SuperAdmin has all permissions
    ...Object.values(Permission),
  ],
  [UserRole.GUEST]: [],
};

/**
 * Authentication state
 */
export interface AuthState {
  /** User's wallet address */
  address: Address | null;

  /** Whether wallet is connected */
  isConnected: boolean;

  /** Whether user is verified via Human Passport */
  isVerified: boolean;

  /** User's role in the system */
  role: UserRole;

  /** User's permissions */
  permissions: Permission[];

  /** Whether auth state is loading */
  isLoading: boolean;

  /** Authentication error if any */
  error: string | null;
}

/**
 * User entity (database model)
 *
 * Complete user data including database fields and timestamps
 */
export interface User {
  // Database fields
  id: string;
  address: string; // Wallet address (lowercase, unique)
  role: UserRole;

  // Human Passport verification
  isVerified: boolean;
  humanityScore?: number | null;
  verifiedAt?: Date | null;

  // NextAuth fields
  name?: string | null;
  email?: string | null;
  emailVerified?: Date | null;
  image?: string | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;

  // Optional profile data
  displayName?: string | null;
  avatar?: string | null;
}

/**
 * User profile data (lightweight, for display)
 *
 * @deprecated Use User instead for consistency with database model
 */
export interface UserProfile {
  address: Address;
  role: UserRole;
  isVerified: boolean;
  humanityScore?: number;
  createdAt: Date;
  lastActive: Date;

  // Optional profile data
  displayName?: string;
  email?: string;
  avatar?: string;

  // Role-specific data
  patientData?: {
    hasMedicalRecords: boolean;
    activeTrials: number;
  };
  clinicData?: {
    name: string;
    license: string;
    patientsCount: number;
  };
  researcherData?: {
    organization: string;
    activeStudies: number;
  };
}

/**
 * Route protection configuration
 */
export interface RouteProtection {
  /** Required authentication level */
  requireAuth: boolean;

  /** Required Human Passport verification */
  requireVerification?: boolean;

  /** Required user roles (any of) */
  allowedRoles?: UserRole[];

  /** Required permissions (all of) */
  requiredPermissions?: Permission[];

  /** Redirect path if unauthorized */
  redirectTo?: string;
}

/**
 * Navigation item configuration
 */
export interface NavItem {
  /** Display label */
  label: string;

  /** Navigation path */
  href: string;

  /** Icon name (lucide-react) */
  icon?: string;

  /** Required role to view */
  roles?: UserRole[];

  /** Required permissions */
  permissions?: Permission[];

  /** Sub-navigation items */
  children?: NavItem[];

  /** Badge text (e.g., "New", "Beta") */
  badge?: string;

  /** External link */
  external?: boolean;
}
