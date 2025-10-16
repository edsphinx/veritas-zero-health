/**
 * Hook: useHumanPassport
 *
 * Manages Human Passport verification state
 * Handles Sybil-resistant proof of personhood
 *
 * Following clean architecture - this hook is the bridge layer between
 * presentation components and API routes.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  VerificationResult,
  HumanVerificationState,
} from '@/shared/types/human.types';

interface UseHumanPassportOptions {
  address?: string;
  enabled?: boolean;
}

export function useHumanPassport(options: UseHumanPassportOptions = {}) {
  const { address, enabled = true } = options;
  const queryClient = useQueryClient();

  // Query verification status
  const {
    data: statusData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['human-passport-status', address],
    queryFn: async () => {
      if (!address) {
        return null;
      }

      const response = await fetch(
        `/api/human/passport/status?address=${address}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch verification status');
      }

      return response.json();
    },
    enabled: enabled && !!address,
    staleTime: 60 * 1000, // Cache for 1 minute
    refetchOnWindowFocus: false, // FIXED: Prevent heavy refresh on tab switch
  });

  // Mutation: Verify passport
  const verifyMutation = useMutation({
    mutationFn: async ({ address, did }: { address: string; did?: string }) => {
      const response = await fetch('/api/human/passport/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, did }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate status query to refresh
      queryClient.invalidateQueries({
        queryKey: ['human-passport-status', variables.address],
      });

      // Store verification in localStorage for persistence
      if (typeof window !== 'undefined' && data.data?.verified) {
        localStorage.setItem(`human_verified_${variables.address}`, 'true');
        localStorage.setItem(
          `human_score_${variables.address}`,
          data.data.score.toString()
        );
      }
    },
  });

  // Derived state
  const verificationState: HumanVerificationState = {
    isLoading: isLoading || verifyMutation.isPending,
    isVerified: statusData?.data?.verified || false,
    verificationDetails: statusData?.data?.details || undefined,
    error: error?.message || verifyMutation.error?.message,
  };

  return {
    // State
    ...verificationState,

    // Actions
    verify: verifyMutation.mutate,
    verifyAsync: verifyMutation.mutateAsync,
    refetch,

    // Detailed data
    humanityScore: statusData?.data?.details?.score,
    verifiedAt: statusData?.data?.details?.verifiedAt,
    expiresAt: statusData?.data?.details?.expiresAt,
    proof: statusData?.data?.details?.proof,
  };
}

/**
 * Hook: useHumanVerification
 *
 * Combined hook for both wallet and passport verification
 * Useful for onboarding flows that require both steps
 */
export function useHumanVerification() {
  const queryClient = useQueryClient();

  // Check wallet connection first
  const walletQuery = useQuery({
    queryKey: ['human-wallet-status'],
    queryFn: async () => {
      const response = await fetch('/api/human/wallet/status');
      return response.json();
    },
  });

  const address = walletQuery.data?.data?.address;

  // Then check passport verification
  const passport = useHumanPassport({
    address,
    enabled: !!address,
  });

  return {
    // Wallet state
    isConnected: walletQuery.data?.data?.connected || false,
    walletAddress: address,

    // Passport state
    isVerified: passport.isVerified,
    humanityScore: passport.humanityScore,
    isLoading: walletQuery.isLoading || passport.isLoading,
    error: passport.error,

    // Actions
    verify: passport.verify,
    verifyAsync: passport.verifyAsync,
    refetch: passport.refetch,
  };
}
