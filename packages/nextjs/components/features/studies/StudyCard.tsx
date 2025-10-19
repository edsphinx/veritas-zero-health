/**
 * StudyCard Component
 *
 * Displays a clinical study in a card format with key information.
 * Modern implementation using shadcn/ui components.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Shield, ChevronRight, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { Study } from '@veritas/types';
import { StudyStatus } from '@veritas/types';

interface StudyCardProps {
  study: Study;
  className?: string;
  showApplyButton?: boolean;
  onApplyClick?: (studyId: string) => void;
}

/**
 * Get status badge configuration
 */
function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    [StudyStatus.Recruiting]: { label: 'Recruiting', variant: 'default' },
    [StudyStatus.Active]: { label: 'Active', variant: 'default' },
    [StudyStatus.Paused]: { label: 'Paused', variant: 'secondary' },
    [StudyStatus.Completed]: { label: 'Completed', variant: 'outline' },
    [StudyStatus.Cancelled]: { label: 'Cancelled', variant: 'destructive' },
    [StudyStatus.Created]: { label: 'Created', variant: 'outline' },
    [StudyStatus.Funding]: { label: 'Funding', variant: 'secondary' },
  };

  return configs[status] || configs[StudyStatus.Recruiting];
}

/**
 * StudyCard Component
 *
 * @example
 * ```tsx
 * <StudyCard
 *   study={studyData}
 *   showApplyButton
 *   onApplyClick={(id) => router.push(`/patient/studies/${id}/apply`)}
 * />
 * ```
 */
export function StudyCard({
  study,
  className,
  showApplyButton = true,
  onApplyClick,
}: StudyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const statusConfig = getStatusConfig(study.status);

  // Truncate address for display
  const shortAddress = study.researcherAddress
    ? `${study.researcherAddress.substring(0, 6)}...${study.researcherAddress.substring(38)}`
    : 'Unknown';

  const isActive = study.status === StudyStatus.Recruiting || study.status === StudyStatus.Active;

  return (
    <Card className={cn('hover:shadow-lg transition-shadow duration-200', className)}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant={statusConfig.variant}>
            {statusConfig.label}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Study #{study.registryId}
          </span>
        </div>

        <CardTitle className="line-clamp-2">{study.title}</CardTitle>

        {study.description && (
          <CardDescription className="line-clamp-2">
            {study.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Researcher Info */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Researcher: {shortAddress}</span>
        </div>

        <Separator />

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {study.participantCount} / {study.maxParticipants} participants
            </span>
          </div>

          {isActive && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <Clock className="h-3.5 w-3.5" />
              <span>Active</span>
            </div>
          )}
        </div>

        {/* Funding Info */}
        {study.totalFunding && (
          <div className="text-xs text-muted-foreground">
            Funding: ${parseFloat(study.totalFunding).toLocaleString()} USDC
          </div>
        )}

        {/* Additional Details Toggle */}
        {showDetails && (
          <div className="space-y-2 text-xs text-muted-foreground pt-2 border-t">
            <div>Sponsor: {study.sponsor.substring(0, 6)}...{study.sponsor.substring(38)}</div>
            {study.certifiedProviders && study.certifiedProviders.length > 0 && (
              <div>Certified Providers: {study.certifiedProviders.length}</div>
            )}
            {study.createdAt && (
              <div>Created: {new Date(study.createdAt).toLocaleDateString()}</div>
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Less Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              More Details
            </>
          )}
        </Button>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/studies/${study.id}`}>
            View Details
            <ChevronRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>

        {showApplyButton && isActive && (
          <Button
            onClick={() => onApplyClick?.(study.id)}
            className="flex-1"
          >
            Check Eligibility
            <Shield className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * StudyCardSkeleton - Loading placeholder
 */
export function StudyCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="h-5 w-20 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="h-6 w-3/4 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-4 w-1/2 bg-muted rounded" />
        <Separator />
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <div className="flex-1 h-10 bg-muted rounded" />
        <div className="flex-1 h-10 bg-muted rounded" />
      </CardFooter>
    </Card>
  );
}

/**
 * EmptyStudyCard - Shown when no studies available
 */
export function EmptyStudyCard({ message }: { message?: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Studies Found</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {message || 'There are currently no clinical trials available in this category.'}
        </p>
      </CardContent>
    </Card>
  );
}
