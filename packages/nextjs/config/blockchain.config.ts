/**
 * Blockchain Configuration
 *
 * Central configuration for all blockchain-related constants
 * SINGLE SOURCE OF TRUTH for network settings
 *
 * Update here and it propagates throughout the entire application
 *
 * IMPORTANT: When changing DEFAULT_CHAIN_ID, also update:
 * - prisma/schema.prisma: All @default(11155420) values
 * - After changing schema, run: npx prisma migrate dev
 */

/**
 * Default chain ID for the application
 * Optimism Sepolia testnet
 *
 * NOTE: Prisma schema defaults also use this value (11155420)
 * but must be updated manually as Prisma doesn't support TS constants
 */
export const DEFAULT_CHAIN_ID = 11155420 as const;

/**
 * Supported chain IDs
 */
export const SUPPORTED_CHAIN_IDS = [
  11155420, // Optimism Sepolia
  // Add more networks as needed:
  // 10,      // Optimism Mainnet
  // 8453,    // Base
  // 84532,   // Base Sepolia
] as const;

/**
 * Chain names for display
 */
export const CHAIN_NAMES: Record<number, string> = {
  11155420: 'Optimism Sepolia',
  10: 'Optimism',
  8453: 'Base',
  84532: 'Base Sepolia',
} as const;

/**
 * Block explorer URLs
 */
export const BLOCK_EXPLORER_URLS: Record<number, string> = {
  11155420: 'https://sepolia-optimism.etherscan.io',
  10: 'https://optimistic.etherscan.io',
  8453: 'https://basescan.org',
  84532: 'https://sepolia.basescan.org',
} as const;

/**
 * RPC URLs (use environment variables for production)
 */
export const RPC_URLS: Record<number, string> = {
  11155420: process.env.NEXT_PUBLIC_OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
  10: process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
  8453: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
  84532: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
} as const;

/**
 * Helper function to get transaction URL
 */
export function getTransactionUrl(chainId: number, txHash: string): string {
  const baseUrl = BLOCK_EXPLORER_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/tx/${txHash}`;
}

/**
 * Helper function to get address URL
 */
export function getAddressUrl(chainId: number, address: string): string {
  const baseUrl = BLOCK_EXPLORER_URLS[chainId];
  if (!baseUrl) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `${baseUrl}/address/${address}`;
}

/**
 * Helper function to check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as typeof SUPPORTED_CHAIN_IDS[number]);
}

/**
 * Helper function to get chain name
 */
export function getChainName(chainId: number): string {
  return CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;
}
