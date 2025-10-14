/**
 * Human Wallet Service for Browser Extension
 *
 * Integrates with Human Wallet via Next.js Extension API routes
 * Supports Web3, Email, and Social login methods
 */

const API_BASE_URL = import.meta.env.VITE_NEXTJS_API_URL || 'http://localhost:3000';

export type WalletConnectionMethod = 'web3' | 'email' | 'google' | 'twitter';

export interface WalletConnectionResult {
  success: boolean;
  data?: {
    address: string;
    method: WalletConnectionMethod;
    sessionId?: string;
  };
  error?: string;
}

export interface WalletStatus {
  connected: boolean;
  address?: string;
  method?: WalletConnectionMethod;
  passportVerified?: boolean;
  passportScore?: number;
}

export class HumanWalletService {
  /**
   * Connect wallet using Human Wallet
   * Opens Next.js onboarding page in new tab for wallet connection
   */
  static async connect(): Promise<WalletConnectionResult> {
    try {
      // Get extension ID
      const extensionId = chrome.runtime.id;

      // Build URL with extension ID as parameter
      const targetUrl = `${API_BASE_URL}/onboarding?extensionId=${extensionId}`;
      console.log('🔗 Opening Human Wallet connection page:', targetUrl);
      console.log('   API_BASE_URL:', API_BASE_URL);
      console.log('   Extension ID:', extensionId);

      // Create tab pointing to Human Wallet connection page
      const tab = await chrome.tabs.create({
        url: targetUrl,
        active: true,
      });

      console.log('✅ Tab created with ID:', tab.id);

      // Wait for connection message from the page
      const result = await new Promise<WalletConnectionResult>((resolve) => {
        const listener = (
          message: any,
          sender: chrome.runtime.MessageSender
        ) => {
          if (
            sender.tab?.id === tab.id &&
            message.type === 'HUMAN_WALLET_CONNECTED'
          ) {
            chrome.runtime.onMessage.removeListener(listener);

            // Don't close tab automatically - let user see success
            setTimeout(() => {
              if (tab.id) {
                chrome.tabs.remove(tab.id);
              }
            }, 2000);

            resolve(message.result);
          }
        };

        chrome.runtime.onMessage.addListener(listener);

        // Timeout after 5 minutes
        setTimeout(() => {
          chrome.runtime.onMessage.removeListener(listener);
          if (tab.id) {
            chrome.tabs.remove(tab.id);
          }
          resolve({
            success: false,
            error: 'Connection timeout. Please try again.',
          });
        }, 5 * 60 * 1000);
      });

      return result;
    } catch (error) {
      console.error('Human Wallet connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect',
      };
    }
  }

  /**
   * Get wallet connection status from Next.js session
   */
  static async getStatus(): Promise<WalletStatus> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/extension/wallet/status`, {
        credentials: 'include', // Include cookies for session
      });

      if (!response.ok) {
        return { connected: false };
      }

      const result = await response.json();

      if (result.success && result.data) {
        return {
          connected: result.data.connected,
          address: result.data.address,
          method: result.data.method,
          passportVerified: result.data.passportVerified,
          passportScore: result.data.passportScore,
        };
      }

      return { connected: false };
    } catch (error) {
      console.error('Error getting wallet status:', error);
      return { connected: false };
    }
  }

  /**
   * Disconnect wallet
   */
  static async disconnect(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/extension/wallet/disconnect`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  /**
   * Verify Human Passport for the connected wallet
   */
  static async verifyPassport(address: string): Promise<{
    success: boolean;
    score?: number;
    verified?: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/extension/passport/verify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ address }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to verify passport',
        };
      }

      return {
        success: true,
        verified: result.data?.verified,
        score: result.data?.score,
      };
    } catch (error) {
      console.error('Error verifying passport:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }
}
