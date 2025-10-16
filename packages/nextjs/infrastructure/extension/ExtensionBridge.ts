/**
 * Extension Bridge
 *
 * Communication layer between Next.js app and Veritas browser extension.
 * Uses window.Veritas API (postMessage) for secure cross-origin messaging.
 *
 * Architecture:
 * Next.js App → ExtensionBridge → window.Veritas → Content Script → Service Worker → Nillion
 *
 * @see packages/browser-extension/src/content/content-script.ts
 */

import { HealthDataPermission } from '@/shared/types/health.types';

/**
 * Type definitions for window.Veritas API
 */
declare global {
  interface Window {
    Veritas?: {
      requestDID(): Promise<string>;
      requestPermission(permissions: string[]): Promise<PermissionResponse>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      requestData(dataType: string): Promise<any>;
      isInstalled(): boolean;
      version: string;
    };
  }
}

/**
 * Permission request response
 */
interface PermissionResponse {
  requestId?: string;
  status: 'pending' | 'approved' | 'denied';
  error?: string;
}

/**
 * Extension Bridge Configuration
 */
export interface ExtensionBridgeConfig {
  waitForExtension?: boolean; // Wait for extension to load (default: true)
  timeout?: number; // Timeout in ms (default: 10000)
}

/**
 * Extension Bridge Error Types
 */
export class ExtensionNotInstalledError extends Error {
  constructor() {
    super('Veritas browser extension is not installed');
    this.name = 'ExtensionNotInstalledError';
  }
}

export class ExtensionTimeoutError extends Error {
  constructor(operation: string) {
    super(`Extension operation timed out: ${operation}`);
    this.name = 'ExtensionTimeoutError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(permissions: string[]) {
    super(`Permission denied: ${permissions.join(', ')}`);
    this.name = 'PermissionDeniedError';
  }
}

/**
 * Extension Bridge
 *
 * Provides a clean, type-safe interface to communicate with the Veritas extension.
 * Handles extension detection, initialization, and error cases.
 *
 * @example
 * ```typescript
 * const bridge = new ExtensionBridge();
 * await bridge.initialize();
 *
 * const did = await bridge.requestDID();
 * const granted = await bridge.requestPermission(['read:diagnoses', 'read:biomarkers']);
 * ```
 */
export class ExtensionBridge {
  private config: Required<ExtensionBridgeConfig>;
  private initialized: boolean = false;

  constructor(config: ExtensionBridgeConfig = {}) {
    this.config = {
      waitForExtension: config.waitForExtension ?? true,
      timeout: config.timeout ?? 10000,
    };
  }

  /**
   * Initialize the bridge and wait for extension to be ready
   *
   * @throws ExtensionNotInstalledError if extension is not detected
   * @throws ExtensionTimeoutError if extension doesn't respond in time
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Check if we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('ExtensionBridge can only be used in browser environment');
    }

    // Wait for extension API to be injected
    if (this.config.waitForExtension) {
      await this.waitForExtension();
    }

    // Check if extension is installed
    if (!this.isExtensionInstalled()) {
      throw new ExtensionNotInstalledError();
    }

    this.initialized = true;
  }

  /**
   * Wait for window.Veritas to be available
   */
  private async waitForExtension(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Veritas) {
        resolve();
        return;
      }

      // Listen for veritas-ready event
      const handleReady = () => {
        window.removeEventListener('veritas-ready', handleReady);
        resolve();
      };

      window.addEventListener('veritas-ready', handleReady);

      // Timeout
      setTimeout(() => {
        window.removeEventListener('veritas-ready', handleReady);
        if (!window.Veritas) {
          reject(new ExtensionTimeoutError('Extension initialization'));
        } else {
          resolve();
        }
      }, this.config.timeout);
    });
  }

  /**
   * Check if extension is installed
   */
  isExtensionInstalled(): boolean {
    return typeof window !== 'undefined' && window.Veritas?.isInstalled() === true;
  }

  /**
   * Get extension version
   */
  getExtensionVersion(): string | null {
    return window.Veritas?.version || null;
  }

  /**
   * Request user's DID from extension
   *
   * @returns DID string (e.g., "did:veritas:...")
   * @throws ExtensionNotInstalledError if extension not available
   * @throws ExtensionTimeoutError if request times out
   */
  async requestDID(): Promise<string> {
    this.ensureInitialized();

    try {
      const did = await window.Veritas!.requestDID();
      return did;
    } catch (error) {
      if (error instanceof Error && error.message === 'Request timeout') {
        throw new ExtensionTimeoutError('DID request');
      }
      throw error;
    }
  }

  /**
   * Request permission to access user's health data
   *
   * Opens extension popup for user approval.
   *
   * @param permissions - Array of permissions to request
   * @returns true if approved, false if denied
   * @throws ExtensionTimeoutError if request times out
   *
   * @example
   * ```typescript
   * const granted = await bridge.requestPermission([
   *   'read:diagnoses',
   *   'read:biomarkers'
   * ]);
   * ```
   */
  async requestPermission(permissions: HealthDataPermission[]): Promise<boolean> {
    this.ensureInitialized();

    try {
      const response = await window.Veritas!.requestPermission(permissions);

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.status === 'denied') {
        throw new PermissionDeniedError(permissions);
      }

      // For pending status, we'd need to implement polling or webhook
      // For now, return true for both approved and pending
      return response.status === 'approved' || response.status === 'pending';
    } catch (error) {
      if (error instanceof Error && error.message === 'Permission request timeout') {
        throw new ExtensionTimeoutError('Permission request');
      }
      throw error;
    }
  }

  /**
   * Request health data from extension (requires permission)
   *
   * @param dataType - Type of health data to request
   * @returns Health records array
   * @throws ExtensionTimeoutError if request times out
   * @throws PermissionDeniedError if permission not granted
   *
   * @example
   * ```typescript
   * const diagnoses = await bridge.requestData('diagnoses');
   * const biomarkers = await bridge.requestData('biomarkers');
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async requestData(dataType: string): Promise<any> {
    this.ensureInitialized();

    try {
      const data = await window.Veritas!.requestData(dataType);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Data request timeout') {
          throw new ExtensionTimeoutError('Data request');
        }
        if (error.message.includes('Permission denied')) {
          throw new PermissionDeniedError([`read:${dataType}`]);
        }
      }
      throw error;
    }
  }

  /**
   * Check if bridge is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Ensure bridge is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ExtensionBridge not initialized. Call initialize() first.');
    }

    if (!this.isExtensionInstalled()) {
      throw new ExtensionNotInstalledError();
    }
  }
}

/**
 * Singleton instance for easy access
 */
let bridgeInstance: ExtensionBridge | null = null;

/**
 * Get or create singleton ExtensionBridge instance
 *
 * @param config - Optional configuration
 * @returns ExtensionBridge instance
 *
 * @example
 * ```typescript
 * const bridge = getExtensionBridge();
 * await bridge.initialize();
 * ```
 */
export function getExtensionBridge(config?: ExtensionBridgeConfig): ExtensionBridge {
  if (!bridgeInstance) {
    bridgeInstance = new ExtensionBridge(config);
  }
  return bridgeInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetExtensionBridge(): void {
  bridgeInstance = null;
}

/**
 * Helper: Check if extension is available (without throwing)
 *
 * Useful for conditional rendering / feature detection
 *
 * @example
 * ```typescript
 * if (isExtensionAvailable()) {
 *   // Show "Connect with Veritas" button
 * } else {
 *   // Show "Install Veritas Extension" message
 * }
 * ```
 */
export function isExtensionAvailable(): boolean {
  return typeof window !== 'undefined' && window.Veritas?.isInstalled() === true;
}
