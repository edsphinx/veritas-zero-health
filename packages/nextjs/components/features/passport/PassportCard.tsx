/**
 * Passport Card Component
 *
 * Detailed card showing Gitcoin Passport verification status.
 * Displays score, verification status, expiration, and stamps.
 *
 * Features:
 * - Shows verification status with color-coded badge
 * - Displays passport score prominently
 * - Shows expiration date
 * - Lists stamps (if available)
 * - Allows refreshing verification
 *
 * Usage:
 * ```tsx
 * <PassportCard address={userAddress} />
 * ```
 */

'use client';

import { useAccount } from 'wagmi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePassportScore, usePassportDetails } from '@/hooks/usePassport';
import { formatPassportScore, isPassportExpired } from '@veritas/types';

export interface PassportCardProps {
  /** Ethereum address to verify (optional, uses connected wallet if not provided) */
  address?: string;
  /** Show stamps list (default: false) */
  showStamps?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * PassportCard - Detailed verification status display
 */
export function PassportCard({
  address: providedAddress,
  showStamps = false,
  className,
}: PassportCardProps) {
  // Get connected wallet address if not provided
  const { address: connectedAddress } = useAccount();
  const address = providedAddress || connectedAddress;

  // Fetch passport score
  const {
    verificationResult,
    isLoading: isLoadingScore,
    refetch: refetchScore,
    isVerified,
    score,
  } = usePassportScore({
    address,
    enabled: !!address,
  });

  // Fetch detailed info (only if showing stamps)
  const { verificationDetails, isLoading: isLoadingDetails } = usePassportDetails({
    address,
    enabled: showStamps && !!address,
  });

  // No wallet connected
  if (!address) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Humanity Verification</CardTitle>
          <CardDescription>Connect your wallet to verify</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Loading state
  if (isLoadingScore) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Humanity Verification</CardTitle>
          <CardDescription>Checking verification status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  // Not verified yet
  if (!verificationResult) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Humanity Verification</CardTitle>
          <CardDescription>Verify your humanity with Gitcoin Passport</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetchScore()}>Verify Now</Button>
        </CardContent>
      </Card>
    );
  }

  // Format dates
  const expiresAt =
    typeof verificationResult.expiresAt === 'string'
      ? new Date(verificationResult.expiresAt)
      : verificationResult.expiresAt;
  const lastUpdated =
    typeof verificationResult.lastUpdated === 'string'
      ? new Date(verificationResult.lastUpdated)
      : verificationResult.lastUpdated;

  const isExpired = isPassportExpired(expiresAt);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Humanity Verification</CardTitle>
            <CardDescription>
              Gitcoin Passport Score: {formatPassportScore(score)}
            </CardDescription>
          </div>
          <Badge
            variant={isVerified && !isExpired ? 'default' : 'destructive'}
            className={
              isVerified && !isExpired
                ? 'bg-secondary text-secondary-foreground'
                : ''
            }
          >
            {isVerified && !isExpired ? '✓ Verified' : 'Not Verified'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Bar */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Score</span>
            <span className="font-medium">{formatPassportScore(score)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary transition-all"
              style={{
                width: `${Math.min((score / verificationResult.threshold) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Threshold: {formatPassportScore(verificationResult.threshold)}
          </div>
        </div>

        {/* Status Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">
              {isVerified ? 'Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Updated</span>
            <span className="font-medium">
              {lastUpdated.toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expires</span>
            <span className={`font-medium ${isExpired ? 'text-destructive' : ''}`}>
              {expiresAt.toLocaleDateString()}
              {isExpired && ' (Expired)'}
            </span>
          </div>
        </div>

        {/* Stamps (if enabled and available) */}
        {showStamps && verificationDetails?.stamps && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">
              Stamps ({verificationDetails.stamps.length})
            </h4>
            {isLoadingDetails ? (
              <div className="text-sm text-muted-foreground">Loading stamps...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {verificationDetails.stamps.map((stamp, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    v{stamp.version}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchScore()}
          className="w-full"
        >
          Refresh Verification
        </Button>

        {/* Get Passport Link */}
        {!isVerified && (
          <Button
            variant="default"
            size="sm"
            className="w-full"
            style={{
              backgroundColor: 'hsl(var(--accent))',
              color: 'hsl(var(--accent-foreground))',
            }}
            onClick={() => window.open('https://passport.xyz', '_blank')}
          >
            Get Gitcoin Passport →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
