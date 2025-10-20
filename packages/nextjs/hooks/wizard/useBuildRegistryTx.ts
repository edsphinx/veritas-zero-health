/**
 * Hook: useBuildRegistryTx
 *
 * Step 2 of wizard - Builds registry transaction via API
 * Component is responsible for signing with wagmi
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

interface BuildRegistryTxParams {
  escrowId: string;
  region: string;
  compensation: string;
  metadataURI?: string;
}

interface BuildRegistryTxResult {
  txData: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: unknown[];
  };
  contractAddress: Address;
  chainId: number;
}

export function useBuildRegistryTx() {
  return useMutation({
    mutationFn: async (params: BuildRegistryTxParams): Promise<BuildRegistryTxResult> => {
      const response = await fetch('/api/studies/wizard/build-registry-tx', {
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
