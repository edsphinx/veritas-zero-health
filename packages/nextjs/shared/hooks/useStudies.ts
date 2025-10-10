/**
 * useStudies Hook
 *
 * React hook for fetching multiple clinical studies from StudyRegistry.
 * Implements pagination, filtering, and sorting.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useStudy, useTotalStudies, Study, StudyStatus } from './useStudy';

// Re-export for convenience
export { StudyStatus, type Study };

/**
 * Filter options for studies
 */
export interface StudyFilters {
  status?: StudyStatus; // Filter by status
  region?: string; // Filter by region (case-insensitive substring match)
  researcher?: string; // Filter by researcher address
}

/**
 * Sort options for studies
 */
export interface StudySortOptions {
  field: 'studyId' | 'status';
  order: 'asc' | 'desc';
}

/**
 * Hook to fetch all studies with pagination and filtering
 *
 * Note: This hook fetches studies individually since the contract doesn't have
 * a batch fetch function. For large numbers of studies, consider using The Graph
 * or implementing a batch fetch in the contract.
 *
 * @param filters - Optional filters to apply
 * @param sort - Optional sort configuration
 * @returns Studies array, loading state, and pagination controls
 *
 * @example
 * ```typescript
 * const { studies, isLoading, totalCount } = useStudies({
 *   filters: { status: StudyStatus.Recruiting },
 *   sort: { field: 'studyId', order: 'desc' }
 * });
 * ```
 */
export function useStudies(options?: {
  filters?: StudyFilters;
  sort?: StudySortOptions;
  limit?: number;
  offset?: number;
}) {
  const { totalStudies, isLoading: totalLoading } = useTotalStudies();
  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all studies
  useEffect(() => {
    if (totalStudies === undefined) return;

    const fetchStudies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const total = Number(totalStudies);
        const fetchPromises: Promise<Study | null>[] = [];

        // Fetch all studies (studyId starts at 1)
        for (let i = 1; i <= total; i++) {
          fetchPromises.push(
            fetch(`/api/studies/${i}`)
              .then(res => res.json())
              .catch(() => null)
          );
        }

        const results = await Promise.all(fetchPromises);
        const validStudies = results.filter((s): s is Study => s !== null);

        setStudies(validStudies);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch studies'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudies();
  }, [totalStudies]);

  // Apply filters, sorting, and pagination
  const processedStudies = useMemo(() => {
    let result = [...studies];

    // Apply filters
    if (options?.filters) {
      const { status, region, researcher } = options.filters;

      if (status !== undefined) {
        result = result.filter(s => s.status === status);
      }

      if (region) {
        const regionLower = region.toLowerCase();
        result = result.filter(s => s.region.toLowerCase().includes(regionLower));
      }

      if (researcher) {
        const researcherLower = researcher.toLowerCase();
        result = result.filter(s => s.researcher.toLowerCase() === researcherLower);
      }
    }

    // Apply sorting
    if (options?.sort) {
      const { field, order } = options.sort;
      result.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];

        if (typeof aVal === 'bigint' && typeof bVal === 'bigint') {
          return order === 'asc'
            ? Number(aVal - bVal)
            : Number(bVal - aVal);
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
  }, [studies, options]);

  return {
    studies: processedStudies,
    totalCount: studies.length,
    filteredCount: processedStudies.length,
    isLoading: totalLoading || isLoading,
    error,
  };
}

/**
 * Hook to fetch recruiting studies only
 *
 * Convenience hook that filters for recruiting studies.
 *
 * @example
 * ```typescript
 * const { studies, isLoading } = useRecruitingStudies();
 * ```
 */
export function useRecruitingStudies(options?: {
  sort?: StudySortOptions;
  limit?: number;
}) {
  return useStudies({
    filters: { status: StudyStatus.Recruiting },
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
 * const { studies, isLoading } = useStudiesByResearcher(address);
 * ```
 */
export function useStudiesByResearcher(researcher: string | undefined) {
  return useStudies({
    filters: researcher ? { researcher } : undefined,
    sort: { field: 'studyId', order: 'desc' },
  });
}

/**
 * Hook to search studies by region
 *
 * @param region - Region search term
 * @returns Studies matching the region
 *
 * @example
 * ```typescript
 * const { studies, isLoading } = useStudiesByRegion('North America');
 * ```
 */
export function useStudiesByRegion(region: string | undefined) {
  return useStudies({
    filters: region ? { region } : undefined,
    sort: { field: 'studyId', order: 'desc' },
  });
}
