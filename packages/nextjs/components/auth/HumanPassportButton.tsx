/**
 * HumanPassportButton Component
 *
 * Button to verify humanity using Human Passport (Gitcoin Passport)
 * Opens passport verification flow in a new window
 */

'use client';

import { useState } from 'react';
import { Shield, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface HumanPassportButtonProps {
  /** User's wallet address */
  address?: `0x${string}`;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
  /** Callback when verification is complete */
  onVerified?: (score: number) => void;
  /** Callback when verification starts */
  onVerificationStart?: () => void;
}

const PASSPORT_URL = 'https://passport.gitcoin.co';

export function HumanPassportButton({
  address,
  size = 'md',
  className,
  onVerified,
  onVerificationStart,
}: HumanPassportButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    if (!address) {
      console.warn('No wallet address provided');
      return;
    }

    setIsVerifying(true);
    if (onVerificationStart) {
      onVerificationStart();
    }

    // Open Human Passport in new window
    const passportUrl = `${PASSPORT_URL}/#/dashboard`;
    window.open(passportUrl, '_blank', 'noopener,noreferrer');

    // Note: User must manually check status after verifying
    // We don't auto-poll to avoid rate limiting
    setTimeout(() => {
      setIsVerifying(false);
    }, 2000);
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleVerify}
      disabled={isVerifying || !address}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm',
        sizeClasses[size],
        className
      )}
    >
      {isVerifying ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Opening Passport...
        </>
      ) : (
        <>
          <Shield className="h-5 w-5" />
          Verify with Human Passport
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
