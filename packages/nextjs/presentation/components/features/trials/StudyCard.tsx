/**
 * Component: StudyCard
 *
 * Displays a clinical study in a card format with key information.
 * Shows status, location, compensation, and applicant count.
 * Includes quick apply button and view details link.
 */

'use client';

import { motion } from 'framer-motion';
import {
  MapPin,
  Users,
  DollarSign,
  Clock,
  Shield,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { Study, StudyStatus } from '@/shared/hooks/useStudy';
import { cn } from '@/shared/lib/utils';

interface StudyCardProps {
  study: Study;
  applicantCount?: bigint;
  className?: string;
  showApplyButton?: boolean;
  onApplyClick?: (studyId: bigint) => void;
}

/**
 * StudyCard Component
 *
 * @example
 * ```tsx
 * <StudyCard
 *   study={studyData}
 *   applicantCount={25n}
 *   showApplyButton
 *   onApplyClick={(id) => router.push(`/trials/${id}/apply`)}
 * />
 * ```
 */
export function StudyCard({
  study,
  applicantCount,
  className,
  showApplyButton = true,
  onApplyClick,
}: StudyCardProps) {
  const statusConfig = {
    [StudyStatus.Recruiting]: {
      label: 'Recruiting',
      color: 'text-green-600',
      bg: 'bg-green-600/10',
      border: 'border-green-600/20',
    },
    [StudyStatus.Closed]: {
      label: 'Closed',
      color: 'text-gray-600',
      bg: 'bg-gray-600/10',
      border: 'border-gray-600/20',
    },
    [StudyStatus.Completed]: {
      label: 'Completed',
      color: 'text-blue-600',
      bg: 'bg-blue-600/10',
      border: 'border-blue-600/20',
    },
  };

  const currentStatus = statusConfig[study.status] || statusConfig[StudyStatus.Recruiting];

  // Truncate researcher address for display
  const shortAddress = `${study.researcher.substring(0, 6)}...${study.researcher.substring(38)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group relative rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
    >
      {/* Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
            currentStatus.bg,
            currentStatus.border,
            currentStatus.color
          )}
        >
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          {currentStatus.label}
        </span>

        <span className="text-xs text-muted-foreground">
          Study #{study.studyId.toString()}
        </span>
      </div>

      {/* Study Info */}
      <div className="space-y-3 mb-4">
        {/* Region */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium">{study.region}</span>
        </div>

        {/* Compensation */}
        {study.compensationDetails && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{study.compensationDetails}</span>
          </div>
        )}

        {/* Researcher */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Researcher: {shortAddress}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {applicantCount !== undefined
              ? `${applicantCount.toString()} applicants`
              : 'Loading...'}
          </span>
        </div>

        {study.status === StudyStatus.Recruiting && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Clock className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        {/* View Details Link */}
        <Link
          href={`/trials/${study.studyId.toString()}`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </Link>

        {/* Apply Button */}
        {showApplyButton && study.status === StudyStatus.Recruiting && (
          <button
            onClick={() => onApplyClick?.(study.studyId)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md"
          >
            Apply Now
            <ExternalLink className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Criteria URI Indicator */}
      {study.criteriaURI && (
        <div className="mt-3 pt-3 border-t border-border">
          <a
            href={study.criteriaURI.startsWith('ipfs://')
              ? `https://ipfs.io/ipfs/${study.criteriaURI.replace('ipfs://', '')}`
              : study.criteriaURI}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            View eligibility criteria
          </a>
        </div>
      )}
    </motion.div>
  );
}

/**
 * StudyCardSkeleton - Loading placeholder
 */
export function StudyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-6 animate-pulse',
        className
      )}
    >
      {/* Status Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="h-6 w-24 bg-muted rounded-full" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>

      {/* Study Info */}
      <div className="space-y-3 mb-4">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded" />
        <div className="h-3 w-40 bg-muted rounded" />
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between py-3 border-t border-border">
        <div className="h-4 w-28 bg-muted rounded" />
        <div className="h-4 w-16 bg-muted rounded" />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-4">
        <div className="flex-1 h-9 bg-muted rounded-lg" />
        <div className="flex-1 h-9 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

/**
 * EmptyStudyCard - Shown when no studies available
 */
export function EmptyStudyCard({ message }: { message?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto mb-4 rounded-full bg-muted p-4 w-fit">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Studies Found</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        {message || 'There are currently no clinical trials available in this category.'}
      </p>
    </div>
  );
}
