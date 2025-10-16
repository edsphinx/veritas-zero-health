/**
 * useStudy Hook
 *
 * React hook for fetching and managing clinical study data from StudyRegistry contract.
 * Uses VZH library for type-safe contract interactions.
 */

'use client';

import { useVzhReadContract } from '@/shared/lib/vzh';
import type { StudyDetailsFromContract, StudyCriteriaFromContract } from '@veritas/types';

/**
 * Study status enum (blockchain contract)
 */
export enum StudyStatus {
  Recruiting = 0,
  Closed = 1,
  Completed = 2,
}

/**
 * Study details from contract
 * @deprecated Use StudyDetailsFromContract from @veritas/types
 */
export type Study = StudyDetailsFromContract;

/**
 * Eligibility criteria for a study
 * @deprecated Use StudyCriteriaFromContract from @veritas/types
 */
export type EligibilityCriteria = Omit<StudyCriteriaFromContract, 'eligibilityCodeHash'> & {
  requiresAgeProof?: boolean;
};

/**
 * Hook to fetch study details
 *
 * @param studyId - ID of the study to fetch
 * @returns Study details, loading state, and error
 *
 * @example
 * ```typescript
 * const { study, isLoading, error } = useStudy(1n);
 * ```
 */
export function useStudy(studyId: bigint | undefined) {
  const { data, isLoading, error } = useVzhReadContract({
    contractName: 'StudyRegistry',
    functionName: 'getStudyDetails',
    args: studyId ? [studyId] : undefined,
    enabled: !!studyId,
  });

  return {
    study: data as Study | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch study eligibility criteria
 *
 * @param studyId - ID of the study
 * @returns Eligibility criteria, loading state, and error
 */
export function useStudyCriteria(studyId: bigint | undefined) {
  const { data, isLoading, error } = useVzhReadContract({
    contractName: 'StudyRegistry',
    functionName: 'getStudyCriteria',
    args: studyId ? [studyId] : undefined,
    enabled: !!studyId,
  });

  return {
    criteria: data as EligibilityCriteria | undefined,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch verified applicant count for a study
 *
 * @param studyId - ID of the study
 * @returns Applicant count, loading state, and error
 */
export function useVerifiedApplicantsCount(studyId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useVzhReadContract({
    contractName: 'StudyRegistry',
    functionName: 'getVerifiedApplicantsCount',
    args: studyId ? [studyId] : undefined,
    enabled: !!studyId,
  });

  return {
    count: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to check if current user has applied to a study
 *
 * @param studyId - ID of the study
 * @param address - User's wallet address
 * @returns Has applied status, loading state, and error
 */
export function useHasApplied(studyId: bigint | undefined, address: string | undefined) {
  const { data, isLoading, error, refetch } = useVzhReadContract({
    contractName: 'StudyRegistry',
    functionName: 'hasAddressApplied',
    args: studyId && address ? [studyId, address] : undefined,
    enabled: !!studyId && !!address,
  });

  return {
    hasApplied: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get total number of studies
 *
 * @returns Total study count, loading state, and error
 */
export function useTotalStudies() {
  const { data, isLoading, error, refetch } = useVzhReadContract({
    contractName: 'StudyRegistry',
    functionName: 'getTotalStudies',
  });

  return {
    totalStudies: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get complete study information (details + criteria + applicants)
 *
 * Fetches all related data for a study in a single hook.
 *
 * @param studyId - ID of the study
 * @param userAddress - Current user's address
 * @returns Complete study information
 */
export function useStudyComplete(studyId: bigint | undefined, userAddress: string | undefined) {
  const { study, isLoading: studyLoading, error: studyError } = useStudy(studyId);
  const { criteria, isLoading: criteriaLoading } = useStudyCriteria(studyId);
  const { count: applicantCount, isLoading: countLoading, refetch: refetchCount } = useVerifiedApplicantsCount(studyId);
  const { hasApplied, isLoading: appliedLoading, refetch: refetchApplied } = useHasApplied(studyId, userAddress);

  return {
    study,
    criteria,
    applicantCount,
    hasApplied,
    isLoading: studyLoading || criteriaLoading || countLoading || appliedLoading,
    error: studyError,
    refetch: () => {
      refetchCount();
      refetchApplied();
    },
  };
}
