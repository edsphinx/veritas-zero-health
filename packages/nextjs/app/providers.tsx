'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { useState } from 'react';
import { chains, projectId, metadata } from '@/config/wagmi.config';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { Toaster } from '@/components/ui/sonner';
import { BlockchainProvider } from '@/shared/providers/blockchain-provider';
import { AuthProvider } from '@/shared/providers/AuthProvider';

// Create Reown AppKit modal with proper configuration
// Use WagmiAdapter as the source of truth for wagmi config
const wagmiAdapter = new WagmiAdapter({
  networks: chains as any,
  projectId,
  ssr: true,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks: chains as any,
  projectId,
  metadata,
  features: {
    analytics: false,
  },
  // Feature MetaMask and popular wallets
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  ],
});

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

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BlockchainProvider>
            {children}
            <Toaster richColors position="top-right" />
          </BlockchainProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
