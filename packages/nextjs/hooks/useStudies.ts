/**
 * useStudies Hook
 *
 * React hook for fetching clinical studies from indexed database.
 * Uses React Query for efficient caching and background updates.
 *
 * Much faster than querying blockchain for each study.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import type { Study } from '@veritas/types';
import { StudyStatus } from '@veritas/types';

// Re-export types for convenience
export type { Study };
export { StudyStatus };

/**
 * Filters for querying studies
 */
export interface UseStudiesFilters {
  status?: string;
  researcherId?: string;
  isActive?: boolean;
}

/**
 * Options for useStudies hook
 */
export interface UseStudiesOptions {
  filters?: UseStudiesFilters;
  limit?: number;
  offset?: number;
  enabled?: boolean; // Disable query execution
}

/**
 * API response type
 */
interface StudiesResponse {
  success: boolean;
  data?: {
    studies: Study[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  error?: string;
}

/**
 * Hook to fetch studies from indexed database
 *
 * Uses React Query for automatic caching, refetching, and background updates.
 *
 * @param options - Query options and filters
 * @returns Query result with studies, loading state, and pagination
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useStudies({
 *   filters: { status: 'recruiting' },
 *   limit: 20
 * });
 * ```
 */
export function useStudies(options: UseStudiesOptions = {}) {
  const { filters, limit = 50, offset = 0, enabled = true } = options;

  return useQuery({
    queryKey: ['studies', filters, limit, offset],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams();

      if (filters?.status) {
        params.append('status', filters.status);
      }

      if (filters?.researcherId) {
        params.append('researcherId', filters.researcherId);
      }

      if (filters?.isActive !== undefined) {
        params.append('isActive', String(filters.isActive));
      }

      if (limit) {
        params.append('limit', String(limit));
      }

      if (offset) {
        params.append('offset', String(offset));
      }

      const response = await fetch(`/api/studies?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch studies');
      }

      const result: StudiesResponse = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch studies');
      }

      return result.data;
    },
    enabled,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to fetch active studies only
 *
 * Convenience hook that filters for recruiting or active studies.
 *
 * @param options - Query options (limit, offset)
 * @returns Query result with active studies
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useActiveStudies({ limit: 10 });
 * ```
 */
export function useActiveStudies(options: Omit<UseStudiesOptions, 'filters'> = {}) {
  return useStudies({
    ...options,
    filters: { isActive: true },
  });
}

/**
 * Hook to fetch studies by researcher
 *
 * @param researcherId - Researcher's wallet address
 * @param options - Additional query options
 * @returns Query result with researcher's studies
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useStudiesByResearcher(address);
 * ```
 */
export function useStudiesByResearcher(
  researcherId: string | undefined,
  options: Omit<UseStudiesOptions, 'filters'> = {}
) {
  return useStudies({
    ...options,
    filters: researcherId ? { researcherId } : undefined,
    enabled: !!researcherId && (options.enabled ?? true),
  });
}

/**
 * Hook to fetch recruiting studies
 *
 * @param options - Query options
 * @returns Query result with recruiting studies
 *
 * @example
 * ```typescript
 * const { data, isLoading } = useRecruitingStudies();
 * ```
 */
export function useRecruitingStudies(options: Omit<UseStudiesOptions, 'filters'> = {}) {
  return useStudies({
    ...options,
    filters: { status: StudyStatus.Recruiting },
  });
}
