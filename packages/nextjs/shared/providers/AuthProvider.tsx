/**
 * AuthProvider - Zustand Store Synchronization
 *
 * PRESENTATION LAYER: Syncs external sources (wagmi, API) with Zustand store.
 * NO local state management - everything goes to Zustand.
 *
 * Clean Architecture:
 * - Listens to wagmi (wallet connection)
 * - Listens to Human Passport verification
 * - Fetches role from API
 * - Updates Zustand store with all changes
 * - Components use useAuth() hook to read from Zustand
 *
 * Benefits:
 * - Single source of truth (Zustand store)
 * - No race conditions (atomic updates)
 * - No infinite loops (controlled sync)
 * - Better performance (memoized selectors)
 */

'use client';

import React, { ReactNode, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useAuthStore } from '@/shared/stores/authStore';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { isSuperAdmin } from '@/shared/lib/auth/superadmin';
import { detectRoleFromAddress } from '@/shared/lib/auth/role-detector';
import { testAddressProvider } from '@/infrastructure/human/TestAddressProvider';
import { UserRole as UserRoleEnum } from '@/shared/types/auth.types';
import type { UserRole } from '@/shared/types/auth.types';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  // Zustand store actions
  const {
    setWalletConnected,
    setWalletDisconnected,
    setVerified,
    setUnverified,
    setVerificationLoading,
    setRole,
    setRoleLoading,
    setTestAddress,
  } = useAuthStore();

  // Wagmi wallet state
  const { address, isConnected } = useAccount();

  // Prevent duplicate role fetches
  const lastFetchedAddress = useRef<string | null>(null);

  // Effect 1: Sync wallet connection
  useEffect(() => {
    if (isConnected && address) {
      console.log('[AuthProvider] 💰 Wallet connected:', address);
      setWalletConnected(address);

      // Check if test address
      const isTest = testAddressProvider.isTestAddress(address);
      setTestAddress(isTest);
      console.log('[AuthProvider] Test address:', isTest);
    } else {
      console.log('[AuthProvider] 💰 Wallet disconnected');
      setWalletDisconnected();
      lastFetchedAddress.current = null;
    }
  }, [address, isConnected, setWalletConnected, setWalletDisconnected, setTestAddress]);

  // Effect 2: Sync Human Passport verification
  const isTestAddress = useAuthStore((state) => state.isTestAddress);

  const {
    isVerified,
    humanId: passportHumanId,
    isLoading: passportLoading,
    error: passportError,
  } = useHumanPassport({
    address,
    enabled: isConnected && !isTestAddress,
  });

  useEffect(() => {
    setVerificationLoading(passportLoading);
  }, [passportLoading, setVerificationLoading]);

  useEffect(() => {
    if (isTestAddress) {
      // Test addresses bypass verification
      setVerified('test-bypass');
      return;
    }

    if (isVerified && passportHumanId) {
      console.log('[AuthProvider] ✅ Human verified:', passportHumanId);
      setVerified(passportHumanId);
    } else {
      setUnverified();
    }
  }, [isVerified, passportHumanId, isTestAddress, setVerified, setUnverified]);

  // Effect 3: Fetch and sync role
  useEffect(() => {
    if (!isConnected || !address) {
      console.log('[AuthProvider] 🎭 Not connected, setting GUEST');
      setRole(UserRoleEnum.GUEST);
      lastFetchedAddress.current = null;
      return;
    }

    // Prevent duplicate fetches
    if (lastFetchedAddress.current === address) {
      console.log('[AuthProvider] 🎭 Role already fetched for this address, skipping');
      return;
    }

    let isMounted = true;
    lastFetchedAddress.current = address;

    console.log('[AuthProvider] 🎭 Fetching role for:', address);
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
  }, [address, isConnected, setRole, setRoleLoading]);

  // Debug log
  const currentState = useAuthStore((state) => ({
    address: state.address,
    role: state.role,
    isConnected: state.isConnected,
    isVerified: state.isVerified,
    isLoading: state.isLoading,
  }));

  console.log('[AuthProvider] State:', currentState);

  return <>{children}</>;
}
