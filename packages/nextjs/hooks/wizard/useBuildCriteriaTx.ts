/**
 * Hook: useBuildCriteriaTx
 *
 * Step 3 of wizard - Builds criteria transaction via API
 * Component is responsible for signing with wagmi
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

interface BuildCriteriaTxParams {
  registryId: string;
  minAge: number;
  maxAge: number;
  eligibilityCodeHash?: string;
}

interface BuildCriteriaTxResult {
  txData: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: unknown[];
  };
  contractAddress: Address;
  chainId: number;
}

export function useBuildCriteriaTx() {
  return useMutation({
    mutationFn: async (params: BuildCriteriaTxParams): Promise<BuildCriteriaTxResult> => {
      const response = await fetch('/api/studies/wizard/build-criteria-tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to build transaction');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to build transaction');
      }

      return result.data;
    },
  });
}
