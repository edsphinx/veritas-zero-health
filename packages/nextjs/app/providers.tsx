'use client'

import { wagmiAdapter, projectId, networks, metadata } from '@/config/wagmi.config'
import { siwxConfig } from '@/config/siwx.config'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SessionProvider } from '@/components/providers/SessionProvider'

// Set up queryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

// Create the modal - done at module level (CRITICAL!)
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  siwx: siwxConfig, // Enable SIWX multichain authentication
  features: {
    analytics: false,
  },
  // Feature MetaMask and popular wallets
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
  ],
  // Theme customization to match DASHI design
  themeMode: 'light',
  themeVariables: {
    '--apkt-accent': '#008060',                 // Emerald Green (primary action)
    '--apkt-color-mix': '#ffffff',              // White background
    '--apkt-color-mix-strength': 0,             // Pure white, no mixing
    '--apkt-border-radius-master': '12px',      // All buttons/cards/inputs same radius
    '--apkt-font-family': 'Inter, system-ui, sans-serif',
    '--apkt-font-size-master': '14px',          // Base font size
    '--apkt-z-index': '9999',
  } as Record<string, string | number>,
  allWallets: 'SHOW', // Show all available wallets
})

export function Providers({
  children,
  cookies
}: {
  children: ReactNode
  cookies: string | null
}) {
  // Hydrate wagmi with cookies from server (CRITICAL for SSR!)
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
