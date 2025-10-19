'use client';

/**
 * Custom Wallet Button Component - Phase 2
 *
 * Enhanced wallet button with dropdown menu showing:
 * - Wallet address (with copy functionality)
 * - Native token balance
 * - Connected network
 * - Disconnect option
 *
 * Uses DASHI brand colors and shadcn/ui components
 */

import { useAppKit, useAppKitAccount, useAppKitState, useAppKitNetwork } from '@reown/appkit/react';
import { useBalance, useEnsName, useEnsAvatar } from 'wagmi';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect } from 'react';
import { Check, Copy, LogOut, Wallet, Network } from 'lucide-react';

export function WalletButton() {
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { caipNetwork } = useAppKitNetwork();
  const { open: modalOpen } = useAppKitState();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch balance
  const { data: balance } = useBalance({
    address: address as `0x${string}` | undefined,
  });

  // Fetch ENS name and avatar
  const { data: ensName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: 1, // Mainnet for ENS
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName || undefined,
    chainId: 1,
  });

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

  // Format balance for display
  const formatBalance = () => {
    if (!balance) return '0.00';
    const value = parseFloat(balance.formatted);
    return value.toFixed(4);
  };

  // Copy address to clipboard
  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle disconnect
  const handleDisconnect = () => {
    // AppKit handles disconnection through the modal
    open({ view: 'Account' });
  };

  // Not connected - show connect button
  if (!isConnected || !address) {
    return (
      <Button
        onClick={() => open()}
        size="lg"
        variant="default"
        className="min-w-[160px] font-semibold transition-all"
        disabled={modalOpen}
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    );
  }

  // Connected - show dropdown with wallet info
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="min-w-[160px] font-semibold transition-all"
        >
          <span className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={ensAvatar || undefined} alt={ensName || address} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {address.slice(2, 4).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {ensName || formatAddress(address)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={ensAvatar || undefined} alt={ensName || address} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {address.slice(2, 4).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                {ensName && (
                  <p className="text-sm font-medium leading-none">{ensName}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  {formatAddress(address)}
                </p>
              </div>
            </div>

            {/* Balance */}
            {balance && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Balance:</span>
                <span className="text-sm font-medium">
                  {formatBalance()} {balance.symbol}
                </span>
              </div>
            )}

            {/* Network */}
            {caipNetwork && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Network:</span>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Network className="w-3 h-3" />
                  {caipNetwork.name || 'Unknown'}
                </span>
              </div>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Copy Address */}
        <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Address
            </>
          )}
        </DropdownMenuItem>

        {/* View Account (opens AppKit modal) */}
        <DropdownMenuItem onClick={() => open({ view: 'Account' })} className="cursor-pointer">
          <Wallet className="w-4 h-4 mr-2" />
          View Account
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Disconnect */}
        <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-destructive">
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
