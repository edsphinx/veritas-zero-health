/**
 * SIWX Configuration for Reown AppKit
 *
 * SIWX (Sign-In With X) is the new chain-agnostic standard for blockchain authentication
 * that replaces SIWE and supports multiple chains (Ethereum, Solana, Bitcoin, etc.)
 *
 * We use ReownAuthentication which manages sessions via Reown Dashboard.
 * This is the recommended approach for production applications.
 *
 * Documentation: https://docs.reown.com/appkit/authentication/siwx/default
 */

import { ReownAuthentication } from '@reown/appkit-siwx';

/**
 * Create SIWX configuration using Reown Authentication
 *
 * This handles:
 * - Multichain message creation (CAIP-122 standard)
 * - Signature verification across different chains
 * - Session management via Reown Dashboard
 * - Automatic integration with wallet connections
 *
 * Custom message configuration for cleaner sign-in experience
 */
// ReownAuthentication doesn't accept options, it uses default configuration
// The message format is controlled by the CAIP-122 standard
export const siwxConfig = new ReownAuthentication();
