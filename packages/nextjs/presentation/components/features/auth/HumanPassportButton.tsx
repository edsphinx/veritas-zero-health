/**
 * Component: HumanPassportButton
 *
 * Button component to trigger Human Passport verification
 * Shows current verification status and initiates verification flow
 *
 * Pure presentation component - no business logic
 * Delegates to useHumanPassport hook
 */

'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useHumanPassport } from '@/shared/hooks/useHumanPassport';
import { cn } from '@/shared/lib/utils';

interface HumanPassportButtonProps {
  address?: string;
  did?: string;
  onVerified?: (score: number) => void;
  onVerificationStart?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function HumanPassportButton({
  address,
  did,
  onVerified,
  onVerificationStart,
  className,
  size = 'md',
  variant = 'default',
}: HumanPassportButtonProps) {
  const { isVerified, isLoading, verify, humanityScore, error } = useHumanPassport({
    address,
    enabled: !!address,
  });

  const handleVerify = () => {
    if (!address) {
      return;
    }

    onVerificationStart?.();

    // Open Passport app in new tab for user to add stamps
    window.open('https://app.passport.xyz/', '_blank', 'noopener,noreferrer');

    // Also trigger a verification check in case they already have stamps
    verify(
      { address, did },
      {
        onSuccess: (data) => {
          if (data.data?.verified && data.data?.score !== undefined) {
            onVerified?.(data.data.score);
          }
        },
      }
    );
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border-2 border-primary bg-transparent text-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-primary hover:bg-primary/10',
  };

  // If already verified, show verification badge
  if (isVerified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg border border-green-600/20 bg-green-600/10 px-4 py-2',
          className
        )}
      >
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <div className="flex flex-col">
          <span className="text-sm font-medium text-green-600">
            Human Verified
          </span>
          {humanityScore !== undefined && (
            <span className="text-xs text-green-600/70">
              Score: {humanityScore}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // If loading
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'inline-flex items-center gap-2 rounded-lg px-4 py-2',
          className
        )}
      >
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Checking verification...
        </span>
      </motion.div>
    );
  }

  // Verification button
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleVerify}
        disabled={!address || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
      >
        <Shield className="h-5 w-5" />
        <span>Verify with Human Passport</span>
      </motion.button>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex items-center gap-2 rounded-md border border-red-600/20 bg-red-600/10 px-3 py-2"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-xs text-red-600">{error}</p>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
export function HumanPassportBadge({ address }: { address?: string }) {
  const { isVerified, isLoading, humanityScore } = useHumanPassport({
    address,
    enabled: !!address,
  });

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span className="text-xs">Checking...</span>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/20 bg-amber-600/10 px-2.5 py-1">
        <AlertCircle className="h-3 w-3 text-amber-600" />
        <span className="text-xs font-medium text-amber-600">Unverified</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-green-600/20 bg-green-600/10 px-2.5 py-1">
      <CheckCircle2 className="h-3 w-3 text-green-600" />
      <span className="text-xs font-medium text-green-600">
        Verified {humanityScore !== undefined && `(${humanityScore})`}
      </span>
    </div>
  );
}
