'use client';

/**
 * useAuth Hook
 *
 * Centralized authentication hook that provides:
 * - User session data
 * - Wallet connection status
 * - Role-based access control
 * - Sign in/out methods
 *
 * Combines NextAuth session with AppKit wallet state
 */

import { useSession } from 'next-auth/react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useMemo } from 'react';
import { UserRole } from '@veritas/types';

export interface AuthUser {
  id: string;
  address: string;
  role: UserRole;
  isVerified: boolean;
  humanityScore?: number | null;
  displayName?: string | null;
  avatar?: string | null;
}

export interface UseAuthReturn {
  // Session state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Wallet state
  walletAddress: string | undefined;
  isWalletConnected: boolean;

  // Role checks
  isPatient: boolean;
  isResearcher: boolean;
  isSponsor: boolean;
  isClinic: boolean;
  isSuperAdmin: boolean;

  // Utilities
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAppKitAccount();

  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null;

    return {
      id: session.user.id,
      address: session.user.address,
      role: session.user.role,
      isVerified: session.user.isVerified,
      humanityScore: session.user.humanityScore,
      displayName: session.user.displayName,
      avatar: session.user.avatar,
    };
  }, [session]);

  const isAuthenticated = useMemo(() => {
    return !!user && status === 'authenticated';
  }, [user, status]);

  const isLoading = useMemo(() => {
    return status === 'loading';
  }, [status]);

  // Role checks
  const isPatient = useMemo(() => user?.role === UserRole.PATIENT, [user]);
  const isResearcher = useMemo(() => user?.role === UserRole.RESEARCHER, [user]);
  const isSponsor = useMemo(() => user?.role === UserRole.SPONSOR, [user]);
  const isClinic = useMemo(() => user?.role === UserRole.CLINIC, [user]);
  const isSuperAdmin = useMemo(() => user?.role === UserRole.SUPERADMIN, [user]);

  // Utility functions
  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return {
    // Session state
    user,
    isAuthenticated,
    isLoading,

    // Wallet state
    walletAddress: address,
    isWalletConnected: isConnected,

    // Role checks
    isPatient,
    isResearcher,
    isSponsor,
    isClinic,
    isSuperAdmin,

    // Utilities
    hasRole,
    hasAnyRole,
  };
}
