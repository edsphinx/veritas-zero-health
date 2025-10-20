/**
 * Hook: useBuildMilestoneTx
 *
 * Step 4 of wizard - Builds milestone transaction(s) via API
 * Component is responsible for signing with wagmi
 */

'use client';

import { useMutation } from '@tanstack/react-query';
import type { Address } from 'viem';

interface MilestoneData {
  type: string;
  description: string;
  rewardAmount: number;
}

interface BuildMilestoneTxParams {
  escrowId: string;
  milestones: MilestoneData[];
  mode?: 'sequential' | 'batch';
}

interface BuildMilestoneTxResult {
  mode: 'sequential' | 'batch';
  txData?: {
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: unknown[];
  };
  txDataArray?: Array<{
    address: Address;
    abi: readonly unknown[];
    functionName: string;
    args: unknown[];
  }>;
  contractAddress: Address;
  chainId: number;
  milestoneCount: number;
}

export function useBuildMilestoneTx() {
  return useMutation({
    mutationFn: async (params: BuildMilestoneTxParams): Promise<BuildMilestoneTxResult> => {
      const response = await fetch('/api/studies/wizard/build-milestone-tx', {
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
