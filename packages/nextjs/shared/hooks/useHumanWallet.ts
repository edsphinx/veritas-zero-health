/**
 * Hook: useHumanWallet
 *
 * Manages Human Wallet connection state
 * Supports Web3, Email, and Social login methods
 *
 * Following clean architecture - this hook is the bridge layer between
 * presentation components and API routes.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WalletConnectionMethod,
  WalletConnectionResult,
  HumanWalletState,
} from '@/shared/types/human.types';

export function useHumanWallet() {
  const queryClient = useQueryClient();

  // Query wallet status
  const {
    data: statusData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['human-wallet-status'],
    queryFn: async () => {
      const response = await fetch('/api/human/wallet/status');
      if (!response.ok) {
        throw new Error('Failed to fetch wallet status');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Mutation: Connect wallet
  const connectMutation = useMutation({
    mutationFn: async ({
      method,
      identifier,
    }: {
      method: WalletConnectionMethod;
      identifier?: string;
    }) => {
      const response = await fetch('/api/human/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, identifier }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Connection failed');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate status query to refresh
      queryClient.invalidateQueries({ queryKey: ['human-wallet-status'] });
    },
  });

  // Mutation: Disconnect wallet
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      // Clear local storage (client-side)
      localStorage.removeItem('human_wallet_address');
      localStorage.removeItem('human_wallet_method');
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['human-wallet-status'] });
    },
  });

  // Derived state
  const walletState: HumanWalletState = {
    isConnecting: connectMutation.isPending,
    isConnected: statusData?.data?.connected || false,
    address: statusData?.data?.address,
    method: statusData?.data?.method,
    error: error?.message || connectMutation.error?.message,
  };

  return {
    // State
    ...walletState,
    isLoading,

    // Actions
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,

    // Helpers
    connectAsync: connectMutation.mutateAsync,
    disconnectAsync: disconnectMutation.mutateAsync,
  };
}

/**
 * Hook: useHumanWalletConnect
 *
 * Simplified hook for just connecting wallets
 * Useful for login/onboarding flows
 */
export function useHumanWalletConnect() {
  const { connect, isConnecting, error } = useHumanWallet();

  return {
    connect,
    isConnecting,
    error,
  };
}
