/**
 * useAuth Hook
 *
 * Central authentication hook for the entire application.
 * Manages wallet connection, verification status, and user roles.
 *
 * @example
 * ```tsx
 * function ProtectedPage() {
 *   const { isAuthenticated, isVerified, role, hasPermission } = useAuth();
 *
 *   if (!isAuthenticated) return <ConnectWallet />;
 *   if (!isVerified) return <VerifyIdentity />;
 *
 *   return <Dashboard />;
 * }
 * ```
 */

'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useHumanPassport } from './useHumanPassport';
import type {
  AuthState,
  UserRole,
  Permission,
  ROLE_PERMISSIONS,
} from '@/shared/types/auth.types';
import { UserRole as UserRoleEnum, Permission as PermissionEnum } from '@/shared/types/auth.types';

/**
 * Determine user role based on wallet address and other factors
 * TODO: Implement proper role detection (e.g., check SBT ownership, registry contracts)
 */
function determineUserRole(address: string | undefined): UserRole {
  if (!address) return UserRoleEnum.GUEST;

  // TODO: Replace with actual role detection logic
  // For now, use address-based detection or localStorage
  if (typeof window !== 'undefined') {
    const savedRole = localStorage.getItem(`user_role_${address}`);
    if (savedRole && Object.values(UserRoleEnum).includes(savedRole as UserRole)) {
      return savedRole as UserRole;
    }
  }

  // Default to patient for connected, verified users
  return UserRoleEnum.PATIENT;
}

/**
 * Get permissions for a given role
 */
function getRolePermissions(role: UserRole): Permission[] {
  const ROLE_PERMS: Record<UserRole, Permission[]> = {
    [UserRoleEnum.PATIENT]: [
      PermissionEnum.VIEW_OWN_RECORDS,
      PermissionEnum.MANAGE_OWN_DATA,
      PermissionEnum.APPLY_TO_TRIALS,
    ],
    [UserRoleEnum.CLINIC]: [
      PermissionEnum.VIEW_PATIENTS,
      PermissionEnum.CREATE_RECORDS,
      PermissionEnum.SCHEDULE_APPOINTMENTS,
    ],
    [UserRoleEnum.RESEARCHER]: [
      PermissionEnum.CREATE_STUDIES,
      PermissionEnum.VIEW_APPLICATIONS,
      PermissionEnum.MANAGE_STUDIES,
    ],
    [UserRoleEnum.ADMIN]: Object.values(PermissionEnum),
    [UserRoleEnum.GUEST]: [],
  };

  return ROLE_PERMS[role] || [];
}

export interface UseAuthReturn extends AuthState {
  /** Whether user is fully authenticated (connected + verified) */
  isAuthenticated: boolean;

  /** Check if user has a specific permission */
  hasPermission: (permission: Permission) => boolean;

  /** Check if user has any of the given roles */
  hasRole: (roles: UserRole | UserRole[]) => boolean;

  /** Check if user has all required permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean;

  /** Switch user role (for testing/demo purposes) */
  switchRole: (newRole: UserRole) => void;
}

/**
 * Main authentication hook
 */
export function useAuth(): UseAuthReturn {
  // Get wallet connection state
  const { address, isConnected } = useAccount();

  // Get Human Passport verification state
  const {
    isVerified,
    isLoading: passportLoading,
    error: passportError,
  } = useHumanPassport({
    address,
    enabled: isConnected,
  });

  // Determine user role
  const role = useMemo(() => {
    if (!isConnected) return UserRoleEnum.GUEST;
    return determineUserRole(address);
  }, [address, isConnected]);

  // Get permissions for role
  const permissions = useMemo(() => {
    return getRolePermissions(role);
  }, [role]);

  // Check if fully authenticated
  const isAuthenticated = isConnected && isVerified;

  // Permission check helper
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  // Role check helper
  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(role);
  };

  // All permissions check helper
  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  // Switch role (for development/testing)
  const switchRole = (newRole: UserRole) => {
    if (typeof window !== 'undefined' && address) {
      localStorage.setItem(`user_role_${address}`, newRole);
      // Force re-render
      window.location.reload();
    }
  };

  return {
    // State
    address: address || null,
    isConnected,
    isVerified,
    role,
    permissions,
    isLoading: passportLoading,
    error: passportError || null,

    // Derived state
    isAuthenticated,

    // Helpers
    hasPermission,
    hasRole,
    hasAllPermissions,
    switchRole,
  };
}

/**
 * Hook to check if current route is accessible
 */
export function useRouteAccess(protection: {
  requireAuth?: boolean;
  requireVerification?: boolean;
  allowedRoles?: UserRole[];
  requiredPermissions?: Permission[];
}) {
  const auth = useAuth();

  const {
    requireAuth = false,
    requireVerification = false,
    allowedRoles = [],
    requiredPermissions = [],
  } = protection;

  // Check authentication
  if (requireAuth && !auth.isConnected) {
    return {
      canAccess: false,
      reason: 'not_connected',
      redirectTo: '/',
    };
  }

  // Check verification
  if (requireVerification && !auth.isVerified) {
    return {
      canAccess: false,
      reason: 'not_verified',
      redirectTo: '/onboarding',
    };
  }

  // Check roles
  if (allowedRoles.length > 0 && !auth.hasRole(allowedRoles)) {
    return {
      canAccess: false,
      reason: 'insufficient_role',
      redirectTo: '/',
    };
  }

  // Check permissions
  if (requiredPermissions.length > 0 && !auth.hasAllPermissions(requiredPermissions)) {
    return {
      canAccess: false,
      reason: 'insufficient_permissions',
      redirectTo: '/',
    };
  }

  return {
    canAccess: true,
    reason: null,
    redirectTo: null,
  };
}
