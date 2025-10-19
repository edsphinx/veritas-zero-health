/**
 * Passport Button Component
 *
 * Button for triggering Gitcoin Passport verification.
 * Shows verification status and allows users to check their humanity score.
 *
 * Features:
 * - Automatic verification when wallet is connected
 * - Shows loading state during verification
 * - Displays verification status (verified/not verified)
 * - Shows passport score
 * - Color-coded based on verification status
 *
 * Usage:
 * ```tsx
 * <PassportButton address={userAddress} />
 * ```
 */

'use client';

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePassportScore } from '@/hooks/usePassport';
import { formatPassportScore } from '@veritas/types';

export interface PassportButtonProps {
  /** Ethereum address to verify (optional, uses connected wallet if not provided) */
  address?: string;
  /** Custom className */
  className?: string;
  /** Auto-verify when address is available (default: true) */
  autoVerify?: boolean;
  /** Show detailed score (default: false) */
  showScore?: boolean;
  /** Callback when verification completes */
  onVerificationComplete?: (verified: boolean, score: number) => void;
}

/**
 * PassportButton - Verify humanity with Gitcoin Passport
 */
export function PassportButton({
  address: providedAddress,
  className,
  autoVerify = true,
  showScore = false,
  onVerificationComplete,
}: PassportButtonProps) {
  // Get connected wallet address if not provided
  const { address: connectedAddress } = useAccount();
  const address = providedAddress || connectedAddress;

  // Fetch passport score with automatic caching
  const { verificationResult, isLoading, error, refetch, isVerified, score } =
    usePassportScore({
      address,
      enabled: autoVerify && !!address,
    });

  // Call callback when verification completes
  useEffect(() => {
    if (verificationResult && onVerificationComplete) {
      onVerificationComplete(verificationResult.verified, verificationResult.score);
    }
  }, [verificationResult, onVerificationComplete]);

  // Handle manual verification
  const handleVerify = async () => {
    if (!address) return;
    await refetch();
  };

  // No wallet connected
  if (!address) {
    return (
      <Button variant="outline" disabled className={className}>
        Connect Wallet First
      </Button>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Button variant="outline" disabled className={className}>
        <span className="animate-pulse">Verifying Humanity...</span>
      </Button>
    );
  }

  // Error state
  if (error) {
    return (
      <Button variant="destructive" onClick={handleVerify} className={className}>
        Verification Failed - Retry
      </Button>
    );
  }

  // Not verified yet or needs refresh
  if (!verificationResult) {
    return (
      <Button
        variant="default"
        onClick={handleVerify}
        className={className}
        style={{
          backgroundColor: 'hsl(var(--secondary))',
          color: 'hsl(var(--secondary-foreground))',
        }}
      >
        Verify Humanity
      </Button>
    );
  }

  // Verified - show status
  if (isVerified) {
    return (
      <div className={`flex items-center gap-2 ${className || ''}`}>
        <Badge
          variant="default"
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
        >
          ✓ Verified Human
        </Badge>
        {showScore && (
          <span className="text-sm text-muted-foreground">
            Score: {formatPassportScore(score)}
          </span>
        )}
      </div>
    );
  }

  // Not verified - show warning
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Badge variant="destructive">Not Verified</Badge>
      {showScore && (
        <span className="text-sm text-muted-foreground">
          Score: {formatPassportScore(score)}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleVerify}
        style={{
          backgroundColor: 'hsl(var(--accent))',
          color: 'hsl(var(--accent-foreground))',
          borderColor: 'hsl(var(--accent))',
        }}
      >
        Improve Score
      </Button>
    </div>
  );
}
