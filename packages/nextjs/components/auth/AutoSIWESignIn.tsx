'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useSession } from 'next-auth/react';
import { useSignMessage } from 'wagmi';
import { signInWithEthereum } from '@/shared/lib/auth/siwe-client';

/**
 * Auto SIWE Sign-In Component
 *
 * Automatically triggers SIWE sign-in when:
 * 1. User connects wallet
 * 2. No active NextAuth session exists
 */
export function AutoSIWESignIn() {
  const { address, isConnected, chainId } = useAccount();
  const { data: session } = useSession();
  const { signMessageAsync } = useSignMessage();
  const [isSigning, setIsSigning] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);

  useEffect(() => {
    const handleAutoSignIn = async () => {
      console.log('[AutoSIWE] Effect triggered:', {
        isConnected,
        hasAddress: !!address,
        hasChainId: !!chainId,
        hasSession: !!session,
        isSigning,
        hasAttempted,
      });

      // Reset attempt flag when wallet disconnects
      if (!isConnected && hasAttempted) {
        console.log('[AutoSIWE] Wallet disconnected, resetting attempt flag');
        setHasAttempted(false);
        return;
      }

      // Only sign in if:
      // 1. Wallet is connected
      // 2. We have an address and chainId
      // 3. No active session
      // 4. Not already signing
      // 5. Haven't attempted yet for this connection
      if (isConnected && address && chainId && !session && !isSigning && !hasAttempted) {
        console.log('[AutoSIWE] ✅ All conditions met, starting SIWE sign-in...');
        setIsSigning(true);
        setHasAttempted(true);

        try {
          console.log('[AutoSIWE] Calling signInWithEthereum...');
          const result = await signInWithEthereum({
            address,
            chainId,
            signMessageAsync,
          });

          if (result.success) {
            console.log('[AutoSIWE] ✅ SIWE sign-in successful! Reloading page...');
            // Reload to get fresh session
            setTimeout(() => {
              window.location.reload();
            }, 500);
          } else {
            console.error('[AutoSIWE] ❌ SIWE sign-in failed:', result.error);
            setIsSigning(false);
            setHasAttempted(false); // Allow retry
          }
        } catch (error) {
          console.error('[AutoSIWE] ❌ SIWE sign-in error:', error);
          setIsSigning(false);
          setHasAttempted(false); // Allow retry
        }
      }
    };

    handleAutoSignIn();
  }, [isConnected, address, chainId, session, signMessageAsync, isSigning, hasAttempted]);

  // This component doesn't render anything
  return null;
}
