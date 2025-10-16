/**
 * useAuth Hook
 *
 * Consumes the global AuthContext provided by AuthProvider.
 * This hook only retrieves the context - all auth logic is in AuthProvider.
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

import { useAuth } from '@/shared/providers/AuthProvider';
import type {
  UserRole,
  Permission,
} from '@/shared/types/auth.types';

// Re-export the useAuth hook from AuthProvider
// All auth logic is centralized in AuthProvider to avoid multiple competing instances
export { useAuth };

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
