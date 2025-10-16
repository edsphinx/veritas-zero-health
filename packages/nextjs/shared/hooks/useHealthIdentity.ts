/**
 * useHealthIdentity Hook
 *
 * React hook for Health Identity SBT data.
 * Uses the service layer instead of direct contract calls.
 */

'use client';

import { useState, useEffect } from 'react';
import type { Address } from 'viem';
import {
  getCompleteHealthIdentity,
  type HealthIdentity,
} from '@/shared/services/health-identity-sbt.service';

export interface UseHealthIdentityOptions {
  address?: Address;
  chainId?: number;
  enabled?: boolean;
}

export interface UseHealthIdentityReturn {
  /** Whether user has a Health Identity SBT */
  hasIdentity: boolean;

  /** Health Identity data */
  identity: HealthIdentity | null;

  /** Attestation hashes */
  attestations: string[];

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Refetch data */
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage Health Identity SBT data
 *
 * @example
 * ```tsx
 * function IdentityCard() {
 *   const { address } = useAccount();
 *   const { hasIdentity, identity, attestations, isLoading } = useHealthIdentity({ address });
 *
 *   if (isLoading) return <Loading />;
 *   if (!hasIdentity) return <ClaimIdentity />;
 *
 *   return <IdentityDetails identity={identity} attestations={attestations} />;
 * }
 * ```
 */
export function useHealthIdentity(
  options: UseHealthIdentityOptions = {}
): UseHealthIdentityReturn {
  const { address, chainId, enabled = true } = options;

  const [hasIdentity, setHasIdentity] = useState(false);
  const [identity, setIdentity] = useState<HealthIdentity | null>(null);
  const [attestations, setAttestations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!address || !enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getCompleteHealthIdentity(address, chainId);

      if (!result) {
        throw new Error('Failed to fetch Health Identity data');
      }

      setHasIdentity(result.hasIdentity);
      setIdentity(result.identity);
      setAttestations(result.attestations);
    } catch (err) {
      console.error('[useHealthIdentity] Error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setHasIdentity(false);
      setIdentity(null);
      setAttestations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, chainId, enabled]);

  return {
    hasIdentity,
    identity,
    attestations,
    isLoading,
    error,
    refetch: fetchData,
  };
}
