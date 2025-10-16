/**
 * useWalletConnection Hook
 *
 * USE-CASE LAYER: Manages wallet connection state with debouncing.
 * Handles Hot Reload disconnects and rapid connect/disconnect cycles.
 *
 * Clean Architecture:
 * - This hook belongs to the USE-CASE LAYER
 * - Consumes Wagmi (INFRASTRUCTURE LAYER)
 * - Provides stable connection state to PRESENTATION LAYER
 *
 * Features:
 * - Debounces disconnection events (prevents Hot Reload issues)
 * - Tracks previous state to detect real changes
 * - Environment-aware timing (dev vs production)
 * - Prevents false positives during initial render
 *
 * @example
 * ```tsx
 * function AuthProvider() {
 *   const { address, isStableConnected, hasChanged } = useWalletConnection();
 *
 *   useEffect(() => {
 *     if (hasChanged && isStableConnected) {
 *       // Handle wallet connected
 *     } else if (hasChanged && !isStableConnected) {
 *       // Handle wallet disconnected
 *     }
 *   }, [hasChanged, isStableConnected]);
 * }
 * ```
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import type { Address } from 'viem';

export interface WalletConnectionState {
  /** Current wallet address (may be undefined during disconnection debounce) */
  address: Address | undefined;

  /** Raw connection state from Wagmi */
  isConnected: boolean;

  /** Stable connection state (debounced) */
  isStableConnected: boolean;

  /** Whether the connection state has changed since last render */
  hasChanged: boolean;

  /** Previous address (useful for detecting account switches) */
  previousAddress: Address | undefined;
}

interface WalletConnectionConfig {
  /** Debounce delay in ms (default: 500ms dev, 200ms prod) */
  debounceMs?: number;

  /** Enable detailed logging */
  debug?: boolean;
}

/**
 * Hook to manage wallet connection with intelligent debouncing
 */
export function useWalletConnection(
  config: WalletConnectionConfig = {}
): WalletConnectionState {
  const {
    debounceMs = process.env.NODE_ENV === 'development' ? 500 : 200,
    debug = false,
  } = config;

  // Get raw Wagmi state
  const { address, isConnected } = useAccount();

  // Track stable state (debounced)
  const [stableState, setStableState] = useState<{
    isConnected: boolean;
    address: Address | undefined;
  }>({
    isConnected: false,
    address: undefined,
  });

  // Track previous state to detect changes
  const prevStateRef = useRef<{
    address: Address | undefined;
    isConnected: boolean;
  }>({
    address: undefined,
    isConnected: false,
  });

  // Track if state has changed
  const [hasChanged, setHasChanged] = useState(false);

  // Disconnection timeout ref
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect: Manage connection state with debouncing
  useEffect(() => {
    const prevAddress = prevStateRef.current.address;
    const prevConnected = prevStateRef.current.isConnected;

    // === CONNECTION ===
    if (isConnected && address) {
      // Clear any pending disconnect timeout
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;

        if (debug) {
          console.log('[useWalletConnection] Canceled pending disconnect');
        }
      }

      // Check if this is a real change
      const addressChanged = address !== prevAddress;
      const connectionChanged = !prevConnected;

      if (addressChanged || connectionChanged) {
        if (debug) {
          console.log('[useWalletConnection] Wallet connected:', {
            address,
            addressChanged,
            connectionChanged,
          });
        }

        setStableState({ isConnected: true, address });
        setHasChanged(true);
        prevStateRef.current = { address, isConnected: true };
      } else {
        // No real change, just a re-render
        setHasChanged(false);
      }
    }
    // === DISCONNECTION ===
    else if (!isConnected && prevConnected) {
      // Only handle disconnection if we were previously connected
      // This prevents false disconnects during initial render or Hot Reload

      if (debug) {
        console.log('[useWalletConnection] Disconnect detected, debouncing for', debounceMs, 'ms');
      }

      // Clear any existing timeout
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }

      // Debounce disconnection
      disconnectTimeoutRef.current = setTimeout(() => {
        if (debug) {
          console.log('[useWalletConnection] Wallet disconnected (debounced)');
        }

        setStableState({ isConnected: false, address: undefined });
        setHasChanged(true);
        prevStateRef.current = { address: undefined, isConnected: false };
      }, debounceMs);
    } else {
      // No change
      setHasChanged(false);
    }

    // Cleanup
    return () => {
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, [address, isConnected, debounceMs, debug]);

  return {
    address: stableState.address,
    isConnected,
    isStableConnected: stableState.isConnected,
    hasChanged,
    previousAddress: prevStateRef.current.address,
  };
}
