/**
 * useApplyToStudy Hook
 *
 * React hook for applying to clinical studies with ZK proof verification.
 * Handles the full application flow including proof generation and submission.
 */

'use client';

import { useCallback } from 'react';
import { useVzhWriteContract } from '@/shared/lib/vzh';
import { useAccount } from 'wagmi';

/**
 * Application submission params
 */
export interface ApplyToStudyParams {
  studyId: bigint;
  ageProof: `0x${string}`; // ZK proof as hex string
}

/**
 * Hook for applying to a clinical study
 *
 * Submits an anonymous application with ZK proof of eligibility.
 * The proof is verified on-chain without revealing actual age.
 *
 * @returns Apply function, loading state, and transaction details
 *
 * @example
 * ```typescript
 * const { apply, isPending, isSuccess } = useApplyToStudy();
 *
 * // After generating ZK proof
 * await apply({
 *   studyId: 1n,
 *   ageProof: '0x...'
 * });
 * ```
 */
export function useApplyToStudy() {
  const { address } = useAccount();

  const {
    write,
    writeAsync,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    hash,
  } = useVzhWriteContract({
    contractName: 'StudyRegistry',
  });

  const apply = useCallback(
    async ({ studyId, ageProof }: ApplyToStudyParams) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      return writeAsync({
        functionName: 'submitAnonymousApplication',
        args: [studyId, ageProof],
      });
    },
    [address, writeAsync]
  );

  return {
    apply,
    isPending: isPending || isConfirming,
    isSuccess,
    isError,
    error,
    txHash: hash,
  };
}

/**
 * Hook for publishing a new study (researcher only)
 *
 * Creates a new clinical study in the registry.
 *
 * @returns Publish function, loading state, and transaction details
 */
export function usePublishStudy() {
  const { address } = useAccount();

  const {
    writeAsync,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    hash,
  } = useVzhWriteContract({
    contractName: 'StudyRegistry',
  });

  const publishStudy = useCallback(
    async (params: {
      region: string;
      compensationDetails: string;
      criteriaURI: string;
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      return writeAsync({
        functionName: 'publishStudy',
        args: [params.region, params.compensationDetails, params.criteriaURI],
      });
    },
    [address, writeAsync]
  );

  return {
    publishStudy,
    isPending: isPending || isConfirming,
    isSuccess,
    isError,
    error,
    txHash: hash,
  };
}

/**
 * Hook for setting study eligibility criteria (researcher only)
 *
 * Configures age requirements for a study.
 *
 * @returns Set criteria function, loading state, and transaction details
 */
export function useSetStudyCriteria() {
  const { address } = useAccount();

  const {
    writeAsync,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    hash,
  } = useVzhWriteContract({
    contractName: 'StudyRegistry',
  });

  const setCriteria = useCallback(
    async (params: {
      studyId: bigint;
      minAge: number;
      maxAge: number;
    }) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      return writeAsync({
        functionName: 'setStudyCriteria',
        args: [params.studyId, params.minAge, params.maxAge],
      });
    },
    [address, writeAsync]
  );

  return {
    setCriteria,
    isPending: isPending || isConfirming,
    isSuccess,
    isError,
    error,
    txHash: hash,
  };
}

/**
 * Hook for closing study recruitment (researcher only)
 *
 * Closes recruitment for a study, preventing new applications.
 *
 * @returns Close recruitment function, loading state, and transaction details
 */
export function useCloseRecruitment() {
  const { address } = useAccount();

  const {
    writeAsync,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    hash,
  } = useVzhWriteContract({
    contractName: 'StudyRegistry',
  });

  const closeRecruitment = useCallback(
    async (studyId: bigint) => {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      return writeAsync({
        functionName: 'closeStudyRecruitment',
        args: [studyId],
      });
    },
    [address, writeAsync]
  );

  return {
    closeRecruitment,
    isPending: isPending || isConfirming,
    isSuccess,
    isError,
    error,
    txHash: hash,
  };
}
