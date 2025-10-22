/**
 * Hook: useBuildEscrowTx
 *
 * Step 1 of wizard - Builds escrow transaction via API
 * Component is responsible for signing with wagmi
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

interface BuildEscrowTxParams {
  title: string;
  // NOTE: description removed - moved to Registry step (Step 2)
  totalFunding: number;
  maxParticipants: number;
  certifiedProviders?: Address[];
}

interface BuildEscrowTxResult {
  txData: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: unknown[];
  };
  contractAddress: Address;
  chainId: number;
}

export function useBuildEscrowTx() {
  return useMutation({
    mutationFn: async (params: BuildEscrowTxParams): Promise<BuildEscrowTxResult> => {
      const response = await fetch('/api/studies/wizard/build-escrow-tx', {
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
