'use client';

/**
 * Custom Wallet Button Component
 *
 * Styled wallet connection button that integrates with Reown AppKit
 * Uses DASHI brand colors and shadcn/ui components
 */

import { useAppKit, useAppKitAccount, useAppKitState } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { open: modalOpen } = useAppKitState();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="outline" size="lg" disabled className="min-w-[160px]">
        Loading...
      </Button>
    );
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <Button
      onClick={() => open()}
      size="lg"
      variant={isConnected ? 'outline' : 'default'}
      className="min-w-[160px] font-semibold transition-all"
      disabled={modalOpen}
    >
      {isConnected && address ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          {formatAddress(address)}
        </span>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}
