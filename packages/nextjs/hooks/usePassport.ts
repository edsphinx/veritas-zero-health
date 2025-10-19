/**
 * usePassport Hook
 *
 * React hook for Gitcoin Passport verification.
 * Provides passport score checking and verification status.
 *
 * Features:
 * - Get passport score for an address
 * - Check verification status
 * - Get detailed verification info with stamps
 * - Automatic caching and refetching with React Query
 *
 * Usage:
 * ```tsx
 * const { verifyPassport, isVerifying, verificationResult } = usePassport();
 *
 * const handleVerify = async () => {
 *   await verifyPassport(address);
 * };
 * ```
 */

'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  VerificationResult,
  VerificationDetails,
} from '@veritas/types';

// ============================================
// API Calls
// ============================================

/**
 * Verify passport and get score
 */
async function verifyPassportAPI(address: string): Promise<VerificationResult> {
  const response = await fetch('/api/passport/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address }),
  });

  const data: { success: boolean; data?: VerificationResult; error?: string } =
    await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to verify passport');
  }

  return data.data;
}

/**
 * Get detailed verification information
 */
async function getVerificationDetailsAPI(
  address: string
): Promise<VerificationDetails> {
  const response = await fetch(`/api/passport/details?address=${address}`);

  const data: { success: boolean; data?: VerificationDetails; error?: string } =
    await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error || 'Failed to get verification details');
  }

  return data.data;
}

// ============================================
// Hook Interface
// ============================================

export interface UsePassportResult {
  // State
  verificationResult: VerificationResult | null;
  verificationDetails: VerificationDetails | null;
  isVerifying: boolean;
  isFetchingDetails: boolean;
  error: string | null;

  // Actions
  verifyPassport: (address: string) => Promise<VerificationResult | null>;
  getVerificationDetails: (address: string) => Promise<VerificationDetails | null>;
  clearVerification: () => void;

  // Helpers
  isVerified: boolean;
  score: number;
}

// ============================================
// Hook Implementation
// ============================================

/**
 * Hook for Gitcoin Passport verification
 */
export function usePassport(): UsePassportResult {
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mutation for verifying passport
  const verifyMutation = useMutation({
    mutationFn: verifyPassportAPI,
    onSuccess: (data) => {
      setVerificationResult(data);
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setVerificationResult(null);
    },
  });

  // Mutation for getting detailed verification info
  const detailsMutation = useMutation({
    mutationFn: getVerificationDetailsAPI,
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  // Actions
  const verifyPassport = async (
    address: string
  ): Promise<VerificationResult | null> => {
    try {
      const result = await verifyMutation.mutateAsync(address);
      return result;
    } catch {
      return null;
    }
  };

  const getVerificationDetails = async (
    address: string
  ): Promise<VerificationDetails | null> => {
    try {
      const details = await detailsMutation.mutateAsync(address);
      return details;
    } catch {
      return null;
    }
  };

  const clearVerification = () => {
    setVerificationResult(null);
    setError(null);
  };

  return {
    // State
    verificationResult,
    verificationDetails: detailsMutation.data || null,
    isVerifying: verifyMutation.isPending,
    isFetchingDetails: detailsMutation.isPending,
    error,

    // Actions
    verifyPassport,
    getVerificationDetails,
    clearVerification,

    // Helpers
    isVerified: verificationResult?.verified || false,
    score: verificationResult?.score || 0,
  };
}

// ============================================
// Query Hook (for automatic fetching)
// ============================================

export interface UsePassportScoreOptions {
  address?: string;
  enabled?: boolean;
}

/**
 * Hook for querying passport score with automatic caching
 * Uses React Query for automatic refetching and caching
 *
 * @param options - Address and enabled flag
 */
export function usePassportScore(options: UsePassportScoreOptions) {
  const { address, enabled = true } = options;

  const query = useQuery({
    queryKey: ['passport-score', address],
    queryFn: () => verifyPassportAPI(address!),
    enabled: enabled && !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    verificationResult: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
    isVerified: query.data?.verified || false,
    score: query.data?.score || 0,
  };
}

/**
 * Hook for querying detailed verification info with automatic caching
 *
 * @param options - Address and enabled flag
 */
export function usePassportDetails(options: UsePassportScoreOptions) {
  const { address, enabled = true } = options;

  const query = useQuery({
    queryKey: ['passport-details', address],
    queryFn: () => getVerificationDetailsAPI(address!),
    enabled: enabled && !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return {
    verificationDetails: query.data || null,
    isLoading: query.isLoading,
    error: query.error?.message || null,
    refetch: query.refetch,
  };
}
