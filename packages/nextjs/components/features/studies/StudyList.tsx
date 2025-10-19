/**
 * StudyList Component
 *
 * Displays a list of clinical studies with filtering and pagination.
 * Uses React Query hooks for data fetching.
 */

'use client';

import { StudyCard, StudyCardSkeleton, EmptyStudyCard } from './StudyCard';
import { useStudies, type UseStudiesFilters } from '@/hooks/useStudies';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface StudyListProps {
  filters?: UseStudiesFilters;
  limit?: number;
  showApplyButton?: boolean;
  onApplyClick?: (studyId: string) => void;
  emptyMessage?: string;
}

/**
 * StudyList Component
 *
 * Displays a grid of study cards with loading and error states.
 *
 * @example
 * ```tsx
 * <StudyList
 *   filters={{ status: 'recruiting' }}
 *   limit={20}
 *   showApplyButton
 *   onApplyClick={(id) => router.push(`/patient/studies/${id}/apply`)}
 * />
 * ```
 */
export function StudyList({
  filters,
  limit = 50,
  showApplyButton = true,
  onApplyClick,
  emptyMessage,
}: StudyListProps) {
  const { data, isLoading, error } = useStudies({ filters, limit });

  // Loading state
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <StudyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load studies: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  // Empty state
  if (!data || data.studies.length === 0) {
    return <EmptyStudyCard message={emptyMessage} />;
  }

  // Success state
  return (
    <div className="space-y-4">
      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {data.studies.length} of {data.pagination.total} studies
      </div>

      {/* Study grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.studies.map((study) => (
          <StudyCard
            key={study.id}
            study={study}
            showApplyButton={showApplyButton}
            onApplyClick={onApplyClick}
          />
        ))}
      </div>

      {/* Load more indicator */}
      {data.pagination.hasMore && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Showing {data.studies.length} of {data.pagination.total} total studies
        </div>
      )}
    </div>
  );
}
