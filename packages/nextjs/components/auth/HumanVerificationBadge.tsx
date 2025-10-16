/**
 * HumanVerificationBadge Component
 *
 * Displays user's Human Passport verification status with score
 * Shows badges for different verification levels
 */

'use client';

import { Shield, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { cn } from '@/shared/lib/utils';

interface HumanVerificationBadgeProps {
  /** User's wallet address */
  address?: `0x${string}`;
  /** Show detailed information */
  showDetails?: boolean;
  /** Compact mode (smaller) */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export function HumanVerificationBadge({
  address,
  showDetails = false,
  compact = false,
  className,
}: HumanVerificationBadgeProps) {
  const { isVerified, humanityScore, isLoading } = useHumanPassport({
    address,
    enabled: !!address,
  });

  if (isLoading) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5',
          className
        )}
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <span className="text-sm text-muted-foreground">Checking...</span>
      </div>
    );
  }

  if (!address) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No wallet connected</span>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-1.5',
          className
        )}
      >
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-700">Not Verified</span>
        {showDetails && humanityScore !== undefined && (
          <span className="text-xs text-yellow-600">
            (Score: {humanityScore}/20)
          </span>
        )}
      </div>
    );
  }

  // Determine verification level based on score
  const getVerificationLevel = (score?: number) => {
    if (!score) return { label: 'Verified', color: 'green' };
    if (score >= 50) return { label: 'Highly Verified', color: 'emerald' };
    if (score >= 30) return { label: 'Well Verified', color: 'green' };
    return { label: 'Verified', color: 'green' };
  };

  const level = getVerificationLevel(humanityScore);

  if (compact) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border bg-green-500/10 px-2.5 py-1',
          `border-${level.color}-500/20`,
          className
        )}
      >
        <CheckCircle2 className={`h-3.5 w-3.5 text-${level.color}-600`} />
        <span className={`text-xs font-medium text-${level.color}-700`}>
          {level.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-card p-4',
        `border-${level.color}-500/20`,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-full bg-${level.color}-500/10 p-2`}>
          <Shield className={`h-6 w-6 text-${level.color}-600`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{level.label}</h3>
            <CheckCircle2 className={`h-4 w-4 text-${level.color}-600`} />
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            Your identity has been verified through Human Passport
          </p>

          {showDetails && humanityScore !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Humanity Score:</span>
                <span className="font-semibold text-foreground">{humanityScore}</span>
              </div>

              {humanityScore >= 20 && (
                <div className="rounded-lg bg-muted/50 p-2">
                  <p className="text-xs text-muted-foreground">
                    ✓ Eligible to apply for clinical trials
                    <br />
                    ✓ Sybil-resistant identity confirmed
                    <br />
                    ✓ Privacy-preserving verification
                  </p>
                </div>
              )}

              <a
                href="https://passport.gitcoin.co"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View on Passport
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
