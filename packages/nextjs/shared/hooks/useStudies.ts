/**
 * useStudies Hook
 *
 * React hook for fetching multiple clinical studies from indexed database.
 * Much faster than querying blockchain for each study.
 * Implements filtering and sorting.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type {
  Study,
  StudyCriteria,
  StudyFilters,
  StudySortOptions,
} from '@veritas/types';
import { StudyStatus } from '@veritas/types';

// Re-export types for backward compatibility
export type { Study, StudyCriteria };
export { StudyStatus };

/**
 * Hook to fetch all studies from indexed database
 *
 * Fetches studies from our Prisma database indexer for fast access.
 * Studies are indexed when created via /api/studies/index.
 *
 * @param filters - Optional filters to apply
 * @param sort - Optional sort configuration
 * @returns Studies array, loading state, and counts
 *
 * @example
 * ```typescript
 * const { studies, loading, totalCount } = useStudies({
 *   filters: { status: 'Active' },
 *   sort: { field: 'registryId', order: 'desc' }
 * });
 * ```
 */
export function useStudies(options?: {
  filters?: StudyFilters;
  sort?: StudySortOptions;
  limit?: number;
  offset?: number;
}) {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all studies from database
  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build query params
        const params = new URLSearchParams();
        if (options?.filters?.researcher) {
          params.append('researcher', options.filters.researcher);
        }
        if (options?.filters?.status) {
          params.append('status', options.filters.status);
        }

        const response = await fetch(`/api/studies?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch studies');
        }

        const result = await response.json();

        if (result.success) {
          // Convert date strings to Date objects
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const studiesWithDates = result.data.map((s: any) => ({
            ...s,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));

          setStudies(studiesWithDates);
        } else {
          throw new Error(result.error || 'Failed to fetch studies');
        }
      } catch (err) {
        console.error('[useStudies] Error:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch studies'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, [options?.filters?.researcher, options?.filters?.status]);

  // Apply client-side sorting and pagination
  const processedStudies = useMemo(() => {
    let result = [...studies];

    // Apply sorting
    if (options?.sort) {
      const { field, order } = options.sort;
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (field === 'registryId') {
          return order === 'asc'
            ? (aVal as number) - (bVal as number)
            : (bVal as number) - (aVal as number);
        }

        if (field === 'createdAt') {
          return order === 'asc'
            ? (aVal as Date).getTime() - (bVal as Date).getTime()
            : (bVal as Date).getTime() - (aVal as Date).getTime();
        }

        if (field === 'status') {
          return order === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        }

        return 0;
      });
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      result = result.slice(options.offset);
    }

    if (options?.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    return result;
  }, [studies, options?.sort, options?.offset, options?.limit]);

  return {
    studies: processedStudies,
    totalCount: studies.length,
    filteredCount: processedStudies.length,
    loading,
    error,
    refetch: () => {
      setStudies([]);
    },
  };
}

/**
 * Hook to fetch active studies only
 *
 * Convenience hook that filters for active studies.
 *
 * @example
 * ```typescript
 * const { studies, loading } = useActiveStudies();
 * ```
 */
export function useActiveStudies(options?: {
  sort?: StudySortOptions;
  limit?: number;
}) {
  return useStudies({
    filters: { status: 'Active' },
    sort: options?.sort,
    limit: options?.limit,
  });
}

/**
 * Hook to fetch studies by researcher
 *
 * @param researcher - Researcher's wallet address
 * @returns Studies created by the researcher
 *
 * @example
 * ```typescript
 * const { studies, loading } = useStudiesByResearcher(address);
 * ```
 */
export function useStudiesByResearcher(researcher: string | undefined) {
  return useStudies({
    filters: researcher ? { researcher } : undefined,
    sort: { field: 'registryId', order: 'desc' },
  });
}

/**
 * @deprecated Use useActiveStudies instead. Kept for backward compatibility.
 */
export const useRecruitingStudies = useActiveStudies;
