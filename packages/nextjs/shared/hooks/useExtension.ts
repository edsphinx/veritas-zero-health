/**
 * useExtension Hook
 *
 * React hook for detecting and interacting with the Veritas browser extension.
 * Provides extension state, connection status, and basic operations.
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { isInstalled, isConnected, version, connect, error } = useExtension();
 *
 *   if (!isInstalled) {
 *     return <InstallExtensionPrompt />;
 *   }
 *
 *   if (!isConnected) {
 *     return <button onClick={connect}>Connect Extension</button>;
 *   }
 *
 *   return <div>Connected to Veritas v{version}</div>;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import {
  ExtensionBridge,
  getExtensionBridge,
  ExtensionNotInstalledError,
  ExtensionTimeoutError,
} from '@/infrastructure/extension/ExtensionBridge';

export interface UseExtensionReturn {
  /** Whether the extension is installed */
  isInstalled: boolean;
  /** Whether the extension is connected and ready */
  isConnected: boolean;
  /** Extension version (if available) */
  version: string | null;
  /** Connect to the extension */
  connect: () => Promise<void>;
  /** Disconnect from the extension */
  disconnect: () => void;
  /** Current error (if any) */
  error: Error | null;
  /** Loading state during connection */
  isLoading: boolean;
  /** Extension bridge instance (for advanced usage) */
  bridge: ExtensionBridge;
}

/**
 * Hook for detecting and connecting to Veritas browser extension
 *
 * @param autoConnect - Automatically connect on mount (default: false)
 * @returns Extension state and methods
 */
export function useExtension(autoConnect: boolean = false): UseExtensionReturn {
  const [bridge] = useState(() => getExtensionBridge());
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check if extension is installed
   */
  const checkInstalled = useCallback(() => {
    const installed = bridge.isExtensionInstalled();
    setIsInstalled(installed);
    return installed;
  }, [bridge]);

  /**
   * Connect to extension
   */
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await bridge.initialize();

      const installedVersion = bridge.getExtensionVersion();
      setVersion(installedVersion);
      setIsConnected(true);
      setIsInstalled(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsConnected(false);

      if (err instanceof ExtensionNotInstalledError) {
        setIsInstalled(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [bridge]);

  /**
   * Disconnect from extension
   */
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setVersion(null);
  }, []);

  /**
   * Listen for extension installation/removal
   */
  useEffect(() => {
    // Initial check
    checkInstalled();

    // Listen for veritas-ready event (extension loaded)
    const handleReady = () => {
      setIsInstalled(true);
      if (autoConnect) {
        connect();
      }
    };

    window.addEventListener('veritas-ready', handleReady);

    // Periodic check (in case extension is installed/uninstalled)
    const interval = setInterval(checkInstalled, 3000);

    return () => {
      window.removeEventListener('veritas-ready', handleReady);
      clearInterval(interval);
    };
  }, [checkInstalled, autoConnect, connect]);

  /**
   * Auto-connect on mount (if requested)
   */
  useEffect(() => {
    if (autoConnect && isInstalled && !isConnected && !isLoading) {
      connect();
    }
  }, [autoConnect, isInstalled, isConnected, isLoading, connect]);

  return {
    isInstalled,
    isConnected,
    version,
    connect,
    disconnect,
    error,
    isLoading,
    bridge,
  };
}
