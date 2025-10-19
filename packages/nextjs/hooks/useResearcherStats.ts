/**
 * useResearcherStats Hook
 *
 * Fetches researcher dashboard statistics
 * Returns aggregated data for active studies, participants, and verifications
 */

import { useQuery } from '@tanstack/react-query';

export interface ResearcherStats {
  activeStudies: number;
  totalStudies: number;
  totalParticipants: number;
  zkVerifications: number;
  pendingApplications: number;
  completedMilestones: number;
}

/**
 * Fetch researcher statistics
 * TODO: Implement actual API call when endpoint is ready
 */
async function fetchResearcherStats(): Promise<ResearcherStats> {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/researcher/stats');
  // if (!response.ok) throw new Error('Failed to fetch stats');
  // return response.json();

  // Mock data for now
  return {
    activeStudies: 0,
    totalStudies: 0,
    totalParticipants: 0,
    zkVerifications: 0,
    pendingApplications: 0,
    completedMilestones: 0,
  };
}

/**
 * Hook to fetch researcher dashboard statistics
 *
 * @example
 * ```tsx
 * const { data: stats, isLoading } = useResearcherStats();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <StatCard
 *     title="Active Studies"
 *     value={stats.activeStudies}
 *     color="primary"
 *   />
 * );
 * ```
 */
export function useResearcherStats() {
  return useQuery({
    queryKey: ['researcher-stats'],
    queryFn: fetchResearcherStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
