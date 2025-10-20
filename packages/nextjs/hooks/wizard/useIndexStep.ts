/**
 * Hook: useIndexStep
 *
 * Indexes a wizard step after user signs and broadcasts transaction
 * Stores transaction hash and extracted IDs for resumability
 */

'use client';

import { useMutation } from '@tanstack/react-query';

interface IndexStepParams {
  step: 'escrow' | 'registry' | 'criteria' | 'milestones';
  txHash: string;
  chainId?: number;
  databaseId?: string;
  escrowId?: string;
  registryId?: string;
  title?: string;
  description?: string;
  totalFunding?: number;
}

interface IndexStepResult {
  escrowId?: string;
  registryId?: string;
  milestoneIds?: string[];
  txHash?: string;
  txHashes?: string[];
  blockNumber: string;
}

export function useIndexStep() {
  return useMutation({
    mutationFn: async (params: IndexStepParams): Promise<IndexStepResult> => {
      const response = await fetch('/api/studies/wizard/index-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to index step');
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to index step');
      }

      return result.data;
    },
  });
}
