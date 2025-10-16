/**
 * Component: StudyList
 *
 * Displays a list of clinical studies with filtering, sorting, and search.
 * Integrates with StudyCard components and handles loading/empty states.
 */

'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Grid, List as ListIcon } from 'lucide-react';

import { useStudies, StudyStatus } from '@/shared/hooks/useStudies';
import { useVerifiedApplicantsCount } from '@/shared/hooks/useStudy';
import { StudyCard, StudyCardSkeleton, EmptyStudyCard } from './StudyCard';
import { cn } from '@/shared/lib/utils';
import type { Study } from '@/shared/types';

type ViewMode = 'grid' | 'list';
type SortField = 'studyId' | 'status'; // Matches hook's accepted fields
type SortOrder = 'asc' | 'desc';

interface StudyListProps {
  statusFilter?: StudyStatus;
  showApplyButton?: boolean;
  onApplyClick?: (studyId: bigint) => void;
  className?: string;
  maxItems?: number;
}

/**
 * StudyList Component
 *
 * @example
 * ```tsx
 * <StudyList
 *   statusFilter={StudyStatus.Active}
 *   showApplyButton
 *   onApplyClick={(id) => router.push(`/studies/${id}/apply`)}
 * />
 * ```
 */
export function StudyList({
  statusFilter = StudyStatus.Active,
  showApplyButton = true,
  onApplyClick,
  className,
  maxItems,
}: StudyListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch studies using the hook
  const { studies, loading, error } = useStudies({
    filters: statusFilter ? { status: statusFilter } : undefined,
    sort: { field: 'createdAt', order: sortOrder },
    limit: maxItems,
  });

  const isLoading = loading;

  // Apply client-side search filter
  const filteredStudies = useMemo(() => {
    let result = studies;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (study) =>
          study.title.toLowerCase().includes(query) ||
          study.description.toLowerCase().includes(query) ||
          study.escrowId.toString().includes(query) ||
          study.researcherAddress.toLowerCase().includes(query)
      );
    }

    return result;
  }, [studies, searchQuery]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <StudyCardSkeleton />
        <StudyCardSkeleton />
        <StudyCardSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-red-600/20 bg-red-600/10 p-8 text-center">
        <p className="text-sm text-red-600">
          Failed to load studies. Please try again later.
        </p>
      </div>
    );
  }

  // Empty state
  if (filteredStudies.length === 0) {
    return (
      <EmptyStudyCard
        message={
          searchQuery
            ? `No studies found matching "${searchQuery}"`
            : 'No active studies available at this time'
        }
      />
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with Search and Controls */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search studies by title, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            {filteredStudies.length} {filteredStudies.length === 1 ? 'study' : 'studies'} found
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            {/* Sort Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-accent transition-colors',
                showFilters && 'bg-accent'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Sort
            </button>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-accent'
                )}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-accent'
                )}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Sort Options (Collapsible) */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Sort by</label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="studyId">Study ID</option>
                  <option value="status">Status</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Study Cards Grid/List */}
      <div
        className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'flex flex-col gap-4'
        )}
      >
        {filteredStudies.map((study, index) => (
          <StudyCardWithCount
            key={study.escrowId.toString()}
            study={study}
            showApplyButton={showApplyButton}
            onApplyClick={onApplyClick}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * StudyCardWithCount - Wrapper that fetches applicant count for each card
 */
function StudyCardWithCount({
  study,
  showApplyButton,
  onApplyClick,
  index,
}: {
  study: Study;
  showApplyButton: boolean;
  onApplyClick?: (studyId: bigint) => void;
  index: number;
}) {
  // Use registryId for fetching applicant count from blockchain
  const { count } = useVerifiedApplicantsCount(BigInt(study.registryId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <StudyCard
        study={study}
        applicantCount={count}
        showApplyButton={showApplyButton}
        onApplyClick={onApplyClick}
      />
    </motion.div>
  );
}
