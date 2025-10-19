/**
 * useStudy Hook
 *
 * React hook for fetching a single clinical study by ID.
 * Uses React Query for efficient caching.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { Study } from '@veritas/types';

/**
 * API response type
 */
interface StudyResponse {
  success: boolean;
  data?: {
    study: Study;
  };
  error?: string;
}

/**
 * Hook to fetch a single study by ID
 *
 * @param studyId - Database ID of the study (not registryId)
 * @param options - Query options
 * @returns Query result with study details
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useStudy(studyId);
 * if (data) {
 *   console.log(data.study.title);
 * }
 * ```
 */
export function useStudy(studyId: string | undefined, options?: {
  enabled?: boolean;
}) {
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: ['study', studyId],
    queryFn: async () => {
      if (!studyId) {
        throw new Error('Study ID is required');
      }

      const response = await fetch(`/api/studies/${studyId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Study not found');
        }
        throw new Error('Failed to fetch study');
      }

      const result: StudyResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch study');
      }

      return result.data.study;
    },
    enabled: !!studyId && enabled,
    staleTime: 1 * 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}
