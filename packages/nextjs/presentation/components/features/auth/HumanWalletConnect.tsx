/**
 * Component: HumanWalletConnect
 *
 * Pure presentation component for Human Wallet connection
 * Supports Web3, Email, and Social login methods
 *
 * Uses Framer Motion for animations
 * No business logic - delegates to useHumanWallet hook
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Mail, Chrome } from 'lucide-react';
import { useState } from 'react';
import { useHumanWallet } from '@/shared/hooks/useHumanWallet';
import { cn } from '@/shared/lib/utils';

interface HumanWalletConnectProps {
  onConnected?: (address: string) => void;
  className?: string;
}

export function HumanWalletConnect({
  onConnected,
  className,
}: HumanWalletConnectProps) {
  const { connect, isConnecting, isConnected, address, error } =
    useHumanWallet();
  const [email, setEmail] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<
    'web3' | 'email' | 'google' | 'twitter' | null
  >(null);

  const handleConnect = (method: 'web3' | 'email' | 'google' | 'twitter') => {
    setSelectedMethod(method);

    if (method === 'email' && !email) {
      return; // Wait for email input
    }

    connect(
      { method, identifier: method === 'email' ? email : undefined },
      {
        onSuccess: (data) => {
          if (data.data?.address) {
            onConnected?.(data.data.address);
          }
        },
      }
    );
  };

  if (isConnected && address) {
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
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-green-600">
              Wallet Connected
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              {address.substring(0, 6)}...{address.substring(38)}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('space-y-4', className)}
    >
      <div className="text-center">
        <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
        <p className="text-sm text-muted-foreground">
          Choose your preferred login method
        </p>
      </div>

      <div className="space-y-3">
        {/* Web3 Wallet */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleConnect('web3')}
          disabled={isConnecting}
          className={cn(
            'w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent',
            isConnecting && selectedMethod === 'web3' && 'opacity-50'
          )}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary p-2">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Web3 Wallet</p>
              <p className="text-xs text-muted-foreground">
                MetaMask, WalletConnect, etc.
              </p>
            </div>
            {isConnecting && selectedMethod === 'web3' && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
        </motion.button>

        {/* Email Login */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-full bg-blue-600 p-2">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Email Login</p>
              <p className="text-xs text-muted-foreground">
                Sign in with your email
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              disabled={isConnecting}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleConnect('email')}
              disabled={isConnecting || !email}
              className={cn(
                'rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:bg-blue-700',
                (isConnecting || !email) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isConnecting && selectedMethod === 'email' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Connect'
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConnect('google')}
            disabled={isConnecting}
            className={cn(
              'rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent',
              isConnecting && selectedMethod === 'google' && 'opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <Chrome className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium">Google</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConnect('twitter')}
            disabled={isConnecting}
            className={cn(
              'rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-accent',
              isConnecting && selectedMethod === 'twitter' && 'opacity-50'
            )}
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              <p className="text-sm font-medium">Twitter</p>
            </div>
          </motion.button>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg border border-red-600/20 bg-red-600/10 p-3"
          >
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
