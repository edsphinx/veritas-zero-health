/**
 * AuthProvider - Global Authentication Context
 *
 * Provides authentication state to entire application.
 * Single source of truth for user auth, role, and permissions.
 *
 * Usage:
 * ```tsx
 * // In app/providers.tsx
 * <AuthProvider>
 *   <YourApp />
 * </AuthProvider>
 *
 * // In any component
 * const { role, isAuthenticated } = useAuth();
 * ```
 */

'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useAccount } from 'wagmi';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';
import { detectRoleFromAddress } from '@/shared/lib/auth/role-detector';
import { testAddressProvider } from '@/infrastructure/human/TestAddressProvider';
import type {
  UserRole,
  Permission,
} from '@/shared/types/auth.types';
import { UserRole as UserRoleEnum, Permission as PermissionEnum } from '@/shared/types/auth.types';
import { useMemo, useState, useEffect } from 'react';

/**
 * Fetch user role from database
 */
async function fetchUserRole(address: string): Promise<UserRole> {
  console.log('[AuthProvider] 🔍 Fetching role for address:', address);

  // 1. Check if SuperAdmin first
  const isSA = isSuperAdmin(address as `0x${string}`);
  if (isSA) {
    console.log('[AuthProvider] ✅ SuperAdmin detected');
    return UserRoleEnum.SUPERADMIN;
  }

  // 2. Try database
  try {
    console.log('[AuthProvider] 🗄️ Checking database...');
    const response = await fetch(`/api/auth/user?address=${address}`);

    if (response.ok) {
      const data = await response.json();
      if (data.user?.role) {
        console.log('[AuthProvider] ✅ Role from database:', data.user.role);
        return data.user.role as UserRole;
      }
    }
  } catch (error) {
    console.warn('[AuthProvider] ⚠️ Database fetch failed:', error);
  }

  // 3. Fallback to .env
  const envRole = detectRoleFromAddress(address);
  if (envRole) {
    console.log('[AuthProvider] ✅ Role from .env:', envRole);
    return envRole;
  }

  // 4. Default
  console.log('[AuthProvider] ⚠️ Defaulting to PATIENT');
  return UserRoleEnum.PATIENT;
}

/**
 * Get permissions for role
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
    [UserRoleEnum.SPONSOR]: [
      PermissionEnum.FUND_STUDIES,
      PermissionEnum.VIEW_FUNDED_STUDIES,
      PermissionEnum.MANAGE_FUNDING,
    ],
    [UserRoleEnum.ADMIN]: [
      PermissionEnum.MANAGE_USERS,
      PermissionEnum.VIEW_ANALYTICS,
      PermissionEnum.SYSTEM_CONFIG,
    ],
    [UserRoleEnum.SUPERADMIN]: Object.values(PermissionEnum),
    [UserRoleEnum.GUEST]: [],
  };

  return ROLE_PERMS[role] || [];
}

export interface AuthContextValue {
  // State
  address: string | null;
  isConnected: boolean;
  isVerified: boolean;
  role: UserRole;
  permissions: Permission[];
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  // Helpers
  hasPermission: (permission: Permission) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  switchRole: (newRole: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Wallet state
  const { address, isConnected } = useAccount();

  // Test address detection
  const isTestAddress = useMemo(() => {
    if (!address) return false;
    return testAddressProvider.isTestAddress(address);
  }, [address]);

  // Human Passport verification (disabled for test addresses)
  const {
    isVerified,
    isLoading: passportLoading,
    error: passportError,
  } = useHumanPassport({
    address,
    enabled: isConnected && !isTestAddress,
  });

  // Role state
  const [role, setRole] = useState<UserRole>(UserRoleEnum.GUEST);
  const [roleLoading, setRoleLoading] = useState(false);

  // Fetch role when address changes
  useEffect(() => {
    if (!isConnected || !address) {
      console.log('[AuthProvider] Not connected, setting GUEST');
      setRole(UserRoleEnum.GUEST);
      setRoleLoading(false);
      return;
    }

    let isMounted = true;
    setRoleLoading(true);

    fetchUserRole(address)
      .then((fetchedRole) => {
        if (isMounted) {
          console.log('[AuthProvider] ✅ Role set:', fetchedRole);
          setRole(fetchedRole);
        }
      })
      .catch((error) => {
        console.error('[AuthProvider] ❌ Role fetch error:', error);
        if (isMounted) {
          setRole(UserRoleEnum.PATIENT);
        }
      })
      .finally(() => {
        if (isMounted) {
          setRoleLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  // Permissions
  const permissions = useMemo(() => getRolePermissions(role), [role]);

  // Authentication status
  const isAuthenticated = useMemo(() => {
    if (!isConnected) return false;

    // Test addresses: only need connection
    if (isTestAddress) {
      console.log('[AuthProvider] ✅ Authenticated (test address bypass)');
      return true;
    }

    // Real addresses: need connection + verification
    const authenticated = isVerified;
    console.log('[AuthProvider]', authenticated ? '✅' : '❌', 'Authenticated (real address, verified:', isVerified, ')');
    return authenticated;
  }, [isConnected, isVerified, isTestAddress]);

  // Loading state
  const isLoading = passportLoading || roleLoading;

  // Helpers
  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(role);
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every((perm) => permissions.includes(perm));
  };

  const switchRole = async (newRole: UserRole) => {
    if (!address) return;

    try {
      const response = await fetch('/api/auth/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, role: newRole }),
      });

      if (response.ok) {
        setRole(newRole);
        console.log('[AuthProvider] Role switched to', newRole);
      }
    } catch (error) {
      console.error('[AuthProvider] Failed to switch role:', error);
    }
  };

  const value: AuthContextValue = {
    address: address || null,
    isConnected,
    isVerified,
    role,
    permissions,
    isLoading,
    error: passportError || null,
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAllPermissions,
    switchRole,
  };

  // Debug log
  console.log('[AuthProvider] State:', {
    address: value.address,
    role: value.role,
    isAuthenticated: value.isAuthenticated,
    isLoading: value.isLoading,
    isTestAddress,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
