'use client';

import { useEffect, useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useSession } from 'next-auth/react';
import { signInWithEthereum } from '@/lib/auth/siwe-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Wallet } from 'lucide-react';

/**
 * Auto SIWE Sign-In Component
 *
 * Automatically triggers SIWE sign-in when:
 * 1. User connects wallet
 * 2. No active NextAuth session exists
 *
 * Shows a fullscreen overlay during authentication to prevent UI flicker
 */
export function AutoSIWESignIn() {
  const { address, isConnected, chainId } = useAccount();
  const { data: session } = useSession();
  const { signMessageAsync } = useSignMessage();
  const [isSigning, setIsSigning] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [signInStatus, setSignInStatus] = useState<'idle' | 'signing' | 'success'>('idle');

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
        setSignInStatus('signing');

        try {
          console.log('[AutoSIWE] Calling signInWithEthereum...');
          const result = await signInWithEthereum({
            address,
            chainId,
            signMessageAsync,
          });

          if (result.success) {
            console.log('[AutoSIWE] ✅ SIWE sign-in successful! Reloading page...');
            setSignInStatus('success');
            // Reload to get fresh session with overlay still visible
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            console.error('[AutoSIWE] ❌ SIWE sign-in failed:', result.error);
            setIsSigning(false);
            setHasAttempted(false); // Allow retry
            setSignInStatus('idle');
          }
        } catch (error) {
          console.error('[AutoSIWE] ❌ SIWE sign-in error:', error);
          setIsSigning(false);
          setHasAttempted(false); // Allow retry
          setSignInStatus('idle');
        }
      }
    };

    handleAutoSignIn();
  }, [isConnected, address, chainId, session, signMessageAsync, isSigning, hasAttempted]);

  // Helper function for status messages
  const getStatusMessage = () => {
    switch (signInStatus) {
      case 'signing':
        return 'Please sign the message in your wallet to authenticate...';
      case 'success':
        return 'Authentication successful! Loading your dashboard...';
      default:
        return '';
    }
  };

  // Render fullscreen overlay during sign-in process
  return (
    <AnimatePresence>
      {isSigning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
          >
            <div className="text-center space-y-6">
              {/* Progress Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    {signInStatus === 'success' ? (
                      <CheckCircle2 className="h-10 w-10 text-success animate-bounce" />
                    ) : (
                      <div className="relative">
                        <Wallet className="h-10 w-10 text-primary" />
                        <Loader2 className="h-5 w-5 text-primary animate-spin absolute -bottom-1 -right-1" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {signInStatus === 'success' ? 'Welcome!' : 'Authenticating...'}
                </h3>
                <p className="text-muted-foreground">{getStatusMessage()}</p>
              </div>

              {/* Info Message */}
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {signInStatus === 'signing'
                    ? 'This ensures you own the wallet address'
                    : 'Redirecting to your dashboard...'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
