/**
 * useAuth Hook
 *
 * USE-CASE LAYER: Consumes Zustand auth store.
 * No more AuthContext - direct Zustand consumption for better performance.
 *
 * Clean Architecture:
 * - Hooks consume stores (use-case layer)
 * - Stores hold state (state layer)
 * - Services handle infrastructure (infrastructure layer)
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

import { useAuthStore, selectIsAuthenticated, selectIsLoadingAny } from '@/shared/stores/authStore';
import type { UserRole, Permission } from '@/shared/types/auth.types';

/**
 * Main auth hook - replaces old AuthContext
 */
export function useAuth() {
  // Subscribe to store
  const address = useAuthStore((state) => state.address);
  const isConnected = useAuthStore((state) => state.isConnected);
  const isVerified = useAuthStore((state) => state.isVerified);
  const humanId = useAuthStore((state) => state.humanId);
  const role = useAuthStore((state) => state.role);
  const permissions = useAuthStore((state) => state.permissions);
  const isTestAddress = useAuthStore((state) => state.isTestAddress);
  const error = useAuthStore((state) => state.error);

  // Loading states
  const isLoading = useAuthStore(selectIsLoadingAny);
  const roleLoading = useAuthStore((state) => state.roleLoading);
  const verificationLoading = useAuthStore((state) => state.verificationLoading);

  // Derived state
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  // Helper functions
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(role);
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(p => permissions.includes(p));
  };

  return {
    // State
    address,
    isConnected,
    isAuthenticated,
    isVerified,
    humanId,
    role,
    permissions,
    isTestAddress,
    error,

    // Loading
    isLoading,
    roleLoading,
    verificationLoading,

    // Helpers
    hasPermission,
    hasRole,
    hasAllPermissions,
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

  console.log('[useRouteAccess] 🔐 Checking access with:', {
    requireAuth,
    requireVerification,
    allowedRoles,
    requiredPermissions,
    currentRole: auth.role,
    isConnected: auth.isConnected,
    isVerified: auth.isVerified,
    isLoading: auth.isLoading,
  });

  // Check authentication
  if (requireAuth && !auth.isConnected) {
    console.log('[useRouteAccess] ❌ Access denied: not connected');
    return {
      canAccess: false,
      reason: 'not_connected',
      redirectTo: '/',
    };
  }

  // Check verification
  if (requireVerification && !auth.isVerified) {
    console.log('[useRouteAccess] ❌ Access denied: not verified');
    return {
      canAccess: false,
      reason: 'not_verified',
      redirectTo: '/onboarding',
    };
  }

  // Check roles
  if (allowedRoles.length > 0) {
    const hasRole = auth.hasRole(allowedRoles);
    console.log('[useRouteAccess] Role check:', {
      hasRole,
      currentRole: auth.role,
      allowedRoles,
    });

    if (!hasRole) {
      console.log('[useRouteAccess] ❌ Access denied: insufficient role');
      return {
        canAccess: false,
        reason: 'insufficient_role',
        redirectTo: '/',
      };
    }
  }

  // Check permissions
  if (requiredPermissions.length > 0 && !auth.hasAllPermissions(requiredPermissions)) {
    console.log('[useRouteAccess] ❌ Access denied: insufficient permissions');
    return {
      canAccess: false,
      reason: 'insufficient_permissions',
      redirectTo: '/',
    };
  }

  console.log('[useRouteAccess] ✅ Access granted');
  return {
    canAccess: true,
    reason: null,
    redirectTo: null,
  };
}
