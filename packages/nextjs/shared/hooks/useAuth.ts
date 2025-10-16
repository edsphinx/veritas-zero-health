/**
 * useAuth Hook (Hybrid NextAuth + AppKit version)
 *
 * Combines NextAuth for session management with AppKit for wallet state.
 * Uses official AppKit hooks to prevent sign loops and hydration issues.
 */

"use client";

import { useSession } from "next-auth/react";
import { useAppKitAccount } from '@reown/appkit/react';
import { useMemo } from "react";
import { UserRole, Permission } from "@/shared/types/auth.types";
import { useClientMounted } from "./useClientMounted";

/**
 * Main auth hook using NextAuth + AppKit
 */
export function useAuth() {
  // Check if client mounted to prevent hydration mismatch
  const mounted = useClientMounted();

  // NextAuth for session/user data
  const { data: session, status } = useSession();

  // AppKit for wallet connection state (only after mount!)
  const { address: walletAddress, isConnected: walletConnected } = useAppKitAccount();

  const isLoading = status === "loading";

  // Derived state - use wallet address from AppKit when mounted
  const user = session?.user;
  const address = mounted ? walletAddress as `0x${string}` | undefined : undefined;
  const isConnected = mounted ? walletConnected : false;
  const isAuthenticated = isConnected && !!user;

  // Debug log (comment out in production)
  // console.log('[useAuth] Current state:', {
  //   hasSession: !!session,
  //   hasUser: !!user,
  //   walletAddress,
  //   address,
  //   role: user?.role,
  //   isConnected,
  //   isAuthenticated,
  //   isLoading,
  // });

  // Helper functions
  const hasPermission = useMemo(() => {
    return (permission: Permission): boolean => {
      if (!user) return false;

      // Get permissions for user's role
      const rolePermissions = getRolePermissions(user.role as UserRole);
      return rolePermissions.includes(permission);
    };
  }, [user]);

  const hasRole = useMemo(() => {
    return (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;

      const roleArray = Array.isArray(roles) ? roles : [roles];
      return roleArray.includes(user.role as UserRole);
    };
  }, [user]);

  const hasAllPermissions = useMemo(() => {
    return (requiredPermissions: Permission[]): boolean => {
      if (!user) return false;

      const rolePermissions = getRolePermissions(user.role as UserRole);
      return requiredPermissions.every(p => rolePermissions.includes(p));
    };
  }, [user]);

  return {
    // Session data
    session,
    user,

    // State
    address,
    isConnected,
    isAuthenticated,
    isVerified: user?.isVerified ?? false,
    humanityScore: user?.humanityScore,
    role: (user?.role as UserRole) || UserRole.GUEST,
    displayName: user?.displayName,
    avatar: user?.avatar,

    // Loading
    isLoading,

    // Helpers
    hasPermission,
    hasRole,
    hasAllPermissions,
  };
}

/**
 * Hook to check route access (NextAuth version)
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
      reason: "not_connected" as const,
      redirectTo: "/",
    };
  }

  // Check verification
  if (requireVerification && !auth.isVerified) {
    return {
      canAccess: false,
      reason: "not_verified" as const,
      redirectTo: "/onboarding",
    };
  }

  // Check roles
  if (allowedRoles.length > 0 && !auth.hasRole(allowedRoles)) {
    return {
      canAccess: false,
      reason: "insufficient_role" as const,
      redirectTo: "/",
    };
  }

  // Check permissions
  if (requiredPermissions.length > 0 && !auth.hasAllPermissions(requiredPermissions)) {
    return {
      canAccess: false,
      reason: "insufficient_permissions" as const,
      redirectTo: "/",
    };
  }

  return {
    canAccess: true,
    reason: null,
    redirectTo: null,
  };
}

// Helper: Get permissions for a role
function getRolePermissions(role: UserRole): Permission[] {
  switch (role) {
    case UserRole.PATIENT:
      return [
        Permission.VIEW_OWN_RECORDS,
        Permission.MANAGE_OWN_DATA,
        Permission.APPLY_TO_TRIALS,
      ];

    case UserRole.RESEARCHER:
      return [
        Permission.CREATE_STUDIES,
        Permission.MANAGE_STUDIES,
        Permission.VIEW_APPLICATIONS,
        Permission.VIEW_ANALYTICS,
      ];

    case UserRole.CLINIC:
      return [
        Permission.VIEW_PATIENTS,
        Permission.CREATE_RECORDS,
        Permission.SCHEDULE_APPOINTMENTS,
      ];

    case UserRole.SPONSOR:
      return [
        Permission.FUND_STUDIES,
        Permission.VIEW_FUNDED_STUDIES,
        Permission.MANAGE_FUNDING,
        Permission.VIEW_ANALYTICS,
      ];

    case UserRole.ADMIN:
      return [
        Permission.MANAGE_USERS,
        Permission.MANAGE_STUDIES,
        Permission.SYSTEM_CONFIG,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_CONTRACTS,
      ];

    case UserRole.SUPERADMIN:
      return [
        Permission.SYSTEM_ADMIN,
        Permission.ASSIGN_ROLES,
        Permission.MANAGE_USERS,
        Permission.MANAGE_CONTRACTS,
        Permission.SYSTEM_CONFIG,
        Permission.VIEW_ANALYTICS,
        Permission.MANAGE_ADMINS,
      ];

    case UserRole.GUEST:
    default:
      return [];
  }
}
