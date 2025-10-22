'use client'

import { wagmiAdapter, projectId, networks, metadata } from '@/config/wagmi.config'
// import { siweConfig } from '@/config/siwx.config'  // Not using siweConfig - manual SIWE flow
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import React, { type ReactNode } from 'react'
import { cookieToInitialState, WagmiProvider, type Config } from 'wagmi'
import { SessionProvider } from '@/components/providers/SessionProvider'
import { AutoSIWESignIn } from '@/components/auth/AutoSIWESignIn'

// Set up queryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data freshness
      staleTime: 5 * 60 * 1000,           // 5 minutes - data stays fresh longer
      gcTime: 10 * 60 * 1000,             // 10 minutes - garbage collection (cache retention)

      // Refetch behavior
      refetchOnWindowFocus: false,        // Don't refetch when window regains focus
      refetchOnMount: false,              // Don't refetch on component mount if data exists
      refetchOnReconnect: false,          // Don't refetch on network reconnect

      // Retry behavior
      retry: 1,                           // Only retry failed requests once
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Performance
      refetchInterval: false,             // Don't poll by default
      refetchIntervalInBackground: false, // Don't poll in background
    },
    mutations: {
      // Mutations retry once by default
      retry: 1,
    },
  },
})

// Create the modal - done at module level (CRITICAL!)
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
  // NOTE: siweConfig commented out for now - using manual SIWE flow like bk_nextjs
  // siweConfig: siweConfig, // Enable SIWE authentication with NextAuth
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
    '--apkt-color-mix': '#f6f9fc',              // Light gray for better hover visibility
    '--apkt-color-mix-strength': 10,            // Subtle mixing for hover states
    '--apkt-border-radius-master': '12px',      // All buttons/cards/inputs same radius
    '--apkt-font-family': 'Inter, system-ui, sans-serif',
    '--apkt-font-size-master': '14px',          // Base font size
    '--apkt-z-index': '9999',
  } as Record<string, string | number>,
  allWallets: 'SHOW', // Show all available wallets
})

import type { Session } from 'next-auth'

export function Providers({
  children,
  cookies,
  session
}: {
  children: ReactNode
  cookies: string | null
  session: Session | null
}) {
  // Hydrate wagmi with cookies from server (CRITICAL for SSR!)
  const initialState = cookieToInitialState(wagmiAdapter.wagmiConfig as Config, cookies)

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={session}>
          <AutoSIWESignIn />
          {children}
        </SessionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
