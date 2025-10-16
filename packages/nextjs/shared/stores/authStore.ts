/**
 * Auth Store - Zustand
 *
 * Single source of truth for authentication state.
 * Replaces useState in AuthProvider to fix race conditions.
 *
 * Clean Architecture:
 * - This is the STATE LAYER
 * - Consumed by hooks in USE-CASE LAYER
 * - Services remain independent in INFRASTRUCTURE LAYER
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import type { Address } from 'viem';
import { UserRole, Permission } from '@/shared/types/auth.types';

// ==================== TYPE DEFINITIONS ====================

export interface AuthState {
  // Wallet state
  address: Address | null;
  isConnected: boolean;

  // Verification state
  isVerified: boolean;
  humanId: string | null;

  // Role & permissions
  role: UserRole;
  permissions: Permission[];

  // Loading states
  isLoading: boolean;
  roleLoading: boolean;
  verificationLoading: boolean;

  // Test address bypass
  isTestAddress: boolean;

  // Error state
  error: string | null;
}

export interface AuthActions {
  // Wallet actions
  setWalletConnected: (address: Address) => void;
  setWalletDisconnected: () => void;

  // Verification actions
  setVerified: (humanId: string) => void;
  setUnverified: () => void;
  setVerificationLoading: (loading: boolean) => void;

  // Role actions
  setRole: (role: UserRole) => void;
  setRoleLoading: (loading: boolean) => void;

  // Permissions
  setPermissions: (permissions: Permission[]) => void;

  // Test address
  setTestAddress: (isTest: boolean) => void;

  // Loading & error
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Composite actions
  setAuthState: (partial: Partial<AuthState>) => void;
  resetAuth: () => void;
}

export type AuthStore = AuthState & AuthActions;

// ==================== INITIAL STATE ====================

const initialState: AuthState = {
  address: null,
  isConnected: false,
  isVerified: false,
  humanId: null,
  role: UserRole.GUEST,
  permissions: [],
  isLoading: false,
  roleLoading: false,
  verificationLoading: false,
  isTestAddress: false,
  error: null,
};

// ==================== ROLE PERMISSIONS MAPPING ====================

const getRolePermissions = (role: UserRole): Permission[] => {
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
};

// ==================== ZUSTAND STORE ====================

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, _get) => ({
        // Initial state
        ...initialState,

        // Wallet actions
        setWalletConnected: (address) => {
          set({
            address,
            isConnected: true,
            error: null,
          }, false, 'wallet/connected');
        },

        setWalletDisconnected: () => {
          set({
            address: null,
            isConnected: false,
            isVerified: false,
            humanId: null,
            role: UserRole.GUEST,
            permissions: [],
            isTestAddress: false,
          }, false, 'wallet/disconnected');
        },

        // Verification actions
        setVerified: (humanId) => {
          set({
            isVerified: true,
            humanId,
            verificationLoading: false,
            error: null,
          }, false, 'verification/verified');
        },

        setUnverified: () => {
          set({
            isVerified: false,
            humanId: null,
            verificationLoading: false,
          }, false, 'verification/unverified');
        },

        setVerificationLoading: (loading) => {
          set({ verificationLoading: loading }, false, 'verification/loading');
        },

        // Role actions
        setRole: (role) => {
          const permissions = getRolePermissions(role);
          set({
            role,
            permissions,
            roleLoading: false,
            error: null,
          }, false, 'role/set');
        },

        setRoleLoading: (loading) => {
          set({ roleLoading: loading }, false, 'role/loading');
        },

        // Permissions
        setPermissions: (permissions) => {
          set({ permissions }, false, 'permissions/set');
        },

        // Test address
        setTestAddress: (isTest) => {
          set({ isTestAddress: isTest }, false, 'test-address/set');
        },

        // Loading & error
        setLoading: (loading) => {
          set({ isLoading: loading }, false, 'loading/set');
        },

        setError: (error) => {
          set({ error }, false, 'error/set');
        },

        // Composite actions
        setAuthState: (partial) => {
          set(partial, false, 'auth/batch-update');
        },

        resetAuth: () => {
          set(initialState, false, 'auth/reset');
        },
      }),
      {
        name: 'veritas-auth-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          // Only persist non-sensitive data
          role: state.role,
          isTestAddress: state.isTestAddress,
          // Don't persist: address, isConnected, isVerified, humanId
          // (these should be fetched fresh on mount)
        }),
      }
    ),
    {
      name: 'AuthStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ==================== SELECTORS ====================

/**
 * Selector: Is user authenticated?
 */
export const selectIsAuthenticated = (state: AuthStore) =>
  state.isConnected && state.address !== null;

/**
 * Selector: Does user have permission?
 */
export const selectHasPermission = (permission: Permission) => (state: AuthStore) =>
  state.permissions.includes(permission);

/**
 * Selector: Does user have role?
 */
export const selectHasRole = (role: UserRole) => (state: AuthStore) =>
  state.role === role;

/**
 * Selector: Does user have all permissions?
 */
export const selectHasAllPermissions = (requiredPermissions: Permission[]) => (state: AuthStore) =>
  requiredPermissions.every(p => state.permissions.includes(p));

/**
 * Selector: Combined loading state
 */
export const selectIsLoadingAny = (state: AuthStore) =>
  state.isLoading || state.roleLoading || state.verificationLoading;
