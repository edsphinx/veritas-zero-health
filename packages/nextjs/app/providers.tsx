'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { SessionProvider } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { chains, projectId, metadata } from '@/config/wagmi.config';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { Toaster } from '@/components/ui/sonner';
import { BlockchainProvider } from '@/shared/providers/blockchain-provider';
import { siweConfig } from '@/config/siwe.config';

// Create Reown AppKit modal with proper configuration
// Use WagmiAdapter as the source of truth for wagmi config
const wagmiAdapter = new WagmiAdapter({
  networks: chains as any,
  projectId,
  ssr: true,
});

// Prevent re-initialization during Hot Reload
declare global {
  interface Window {
    __APPKIT_INITIALIZED__?: boolean;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Initialize AppKit on client-side only, after mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__APPKIT_INITIALIZED__) {
      createAppKit({
        adapters: [wagmiAdapter],
        networks: chains as any,
        projectId,
        metadata,
        siweConfig, // 🔑 SIWE integration for automatic sign-in
        features: {
          analytics: false,
        },
        // Feature MetaMask and popular wallets
        featuredWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
        ],
      });
      window.__APPKIT_INITIALIZED__ = true;
    }
  }, []);

  return (
    <SessionProvider>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <BlockchainProvider>
            {children}
            <Toaster richColors position="top-right" />
          </BlockchainProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
