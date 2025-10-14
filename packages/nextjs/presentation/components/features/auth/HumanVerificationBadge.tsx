/**
 * Component: HumanVerificationBadge
 *
 * Displays detailed Human Passport verification status
 * Shows verification level, score, stamps, and timestamp
 *
 * Pure presentation component - delegates to useHumanPassport hook
 */

'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { cn } from '@/shared/lib/utils';

interface HumanVerificationBadgeProps {
  address?: string;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function HumanVerificationBadge({
  address,
  showDetails = false,
  compact = false,
  className,
}: HumanVerificationBadgeProps) {
  const {
    isVerified,
    isLoading,
    humanityScore,
    verifiedAt,
    expiresAt,
    error,
  } = useHumanPassport({
    address,
    enabled: !!address,
  });

  // Format dates
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'rounded-lg border border-border bg-card p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Checking Verification Status</p>
            <p className="text-xs text-muted-foreground">
              Please wait...
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-lg border border-red-600/20 bg-red-600/10 p-4',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-600">
              Verification Error
            </p>
            <p className="text-xs text-red-600/70 mt-1">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Not verified state
  if (!isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-lg border border-amber-600/20 bg-amber-600/10 p-4',
          className
        )}
      >
        <div className="flex items-start gap-3">
          <Shield className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-600">
              Not Verified
            </p>
            <p className="text-xs text-amber-600/70 mt-1">
              Complete Human Passport verification to prove you&apos;re a unique person
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Verified state - compact (for user menu, inline display)
  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="rounded-full bg-success p-1">
          <CheckCircle2 className="h-3 w-3 text-success-foreground" />
        </div>
        <span className="text-xs font-medium text-success">Verified</span>
      </div>
    );
  }

  // Verified state - standard (not detailed)
  if (!showDetails) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'rounded-lg border border-green-600/20 bg-green-600/10 p-4',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-green-600 p-2">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-600">
              Human Verified ✓
            </p>
            {humanityScore !== undefined && (
              <p className="text-xs text-green-600/70 mt-0.5">
                Humanity Score: {humanityScore}/100
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Verified state - detailed
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'rounded-lg border border-green-600/20 bg-gradient-to-br from-green-600/10 to-green-600/5 p-5',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="rounded-full bg-green-600 p-2.5">
          <CheckCircle2 className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-base font-semibold text-green-600">
            Human Verified
          </p>
          <p className="text-xs text-green-600/70">
            Sybil-Resistant Identity Confirmed
          </p>
        </div>
      </div>

      {/* Score */}
      {humanityScore !== undefined && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Humanity Score</span>
            <span className="font-medium text-green-600">{humanityScore}/100</span>
          </div>
          <div className="h-2 rounded-full bg-green-600/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${humanityScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-green-600 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 border-t border-green-600/20 pt-3">
        {verifiedAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Verified On
            </span>
            <span className="font-medium">{formatDate(verifiedAt)}</span>
          </div>
        )}
        {expiresAt && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Expires
            </span>
            <span className="font-medium">{formatDate(expiresAt)}</span>
          </div>
        )}
      </div>

      {/* Info note */}
      <div className="mt-4 rounded-md bg-green-600/10 border border-green-600/20 p-3">
        <p className="text-xs text-green-600/80 leading-relaxed">
          <strong>What this means:</strong> You&apos;ve proven you&apos;re a unique human through Human Passport. This helps prevent fake accounts and ensures fair access to clinical trials.
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Inline verification indicator for tables/lists
 */
export function InlineVerificationIndicator({
  isVerified,
  score,
}: {
  isVerified: boolean;
  score?: number;
}) {
  if (!isVerified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <AlertCircle className="h-3 w-3" />
        Unverified
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600">
      <CheckCircle2 className="h-3 w-3" />
      Verified {score !== undefined && `(${score})`}
    </span>
  );
}
