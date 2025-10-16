/**
 * SIWE Configuration for Reown AppKit
 *
 * This configures Sign-In With Ethereum using Reown's official @reown/appkit-siwe package.
 * The modal will automatically handle SIWE sign-in when connecting a wallet.
 */

import {
  type SIWESession,
  type SIWEVerifyMessageArgs,
  type SIWECreateMessageArgs,
  createSIWEConfig,
  formatMessage,
} from '@reown/appkit-siwe';
import { getCsrfToken, getSession, signIn, signOut } from 'next-auth/react';
import { getAddress } from 'viem';

// Normalize address to checksum format
const normalizeAddress = (address: string): string => {
  try {
    const splitAddress = address.split(':');
    const extractedAddress = splitAddress[splitAddress.length - 1];
    const checksumAddress = getAddress(extractedAddress);
    splitAddress[splitAddress.length - 1] = checksumAddress;
    return splitAddress.join(':');
  } catch (error) {
    return address;
  }
};

export const siweConfig = createSIWEConfig({
  // Get message parameters
  getMessageParams: async () => ({
    domain: typeof window !== 'undefined' ? window.location.host : '',
    uri: typeof window !== 'undefined' ? window.location.origin : '',
    chains: [11155420], // Optimism Sepolia
    statement: 'Sign in to Veritas Zero Health',
  }),

  // Create SIWE message
  createMessage: ({ address, ...args }: SIWECreateMessageArgs) =>
    formatMessage(args, normalizeAddress(address)),

  // Get CSRF nonce
  getNonce: async () => {
    const nonce = await getCsrfToken();
    if (!nonce) {
      throw new Error('Failed to get nonce!');
    }
    return nonce;
  },

  // Get current session
  getSession: async () => {
    const session = await getSession();
    if (!session) {
      return null;
    }

    // Validate address and chainId
    if (typeof session.address !== 'string' || typeof session.chainId !== 'number') {
      return null;
    }

    return { address: session.address, chainId: session.chainId } satisfies SIWESession;
  },

  // Verify message and sign in
  verifyMessage: async ({ message, signature }: SIWEVerifyMessageArgs) => {
    try {
      const success = await signIn('credentials', {
        message,
        signature,
        redirect: false,
      });

      return Boolean(success?.ok);
    } catch (error) {
      console.error('[SIWE] Verify message error:', error);
      return false;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await signOut({ redirect: false });
      return true;
    } catch (error) {
      console.error('[SIWE] Sign out error:', error);
      return false;
    }
  },
});
