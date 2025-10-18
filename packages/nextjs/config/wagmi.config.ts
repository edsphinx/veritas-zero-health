/**
 * Wagmi Configuration using WagmiAdapter (Official Pattern)
 *
 * This follows the official Reown AppKit pattern where WagmiAdapter
 * is the single source of truth for wagmi configuration.
 *
 * Key Pattern:
 * 1. Create WagmiAdapter with networks and projectId
 * 2. Extract wagmiConfig from adapter (don't create manually)
 * 3. Use AppKitNetwork types (not wagmi chain types)
 */

import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import {
  mainnet,
  sepolia,
  polygon,
  polygonAmoy,
  celo,
  celoAlfajores,
  optimismSepolia,
  optimism,
  type AppKitNetwork,
} from '@reown/appkit/networks';

// Get projectId from environment or use default for testing
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

if (!projectId) {
  throw new Error('Project ID is not defined');
}

// Define supported networks using AppKitNetwork type
// Default to testnets for development, add mainnets in production
export const networks = [
  optimismSepolia, // Optimism Sepolia testnet (PRIMARY)
  sepolia, // Ethereum Sepolia testnet
  polygonAmoy, // Polygon Amoy testnet
  celoAlfajores, // Celo Alfajores testnet
  ...(process.env.NODE_ENV === 'production'
    ? [optimism, mainnet, polygon, celo] // Add mainnets in production
    : []),
] as [AppKitNetwork, ...AppKitNetwork[]];

// App metadata for Reown AppKit
export const metadata = {
  name: 'Veritas Zero Health',
  description: 'Private, Verifiable Patient Data for Clinical Trials',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://veritas.health',
  icons: ['https://veritas.health/icon.png'],
};

/**
 * WagmiAdapter - The Single Source of Truth
 *
 * This adapter creates and manages the wagmi configuration internally.
 * DO NOT create a separate wagmi config with createConfig().
 */
export const wagmiAdapter = new WagmiAdapter({
  ssr: true, // Enable server-side rendering support
  projectId,
  networks,
});

/**
 * Wagmi Config - Extract from Adapter
 *
 * This is the wagmi config that should be used throughout the app.
 * It's created by WagmiAdapter and includes all necessary configuration.
 */
export const wagmiConfig = wagmiAdapter.wagmiConfig;

// Helper: Get network by chain ID
export function getChainById(chainId: number) {
  return networks.find((network) => network.id === chainId);
}

// Helper: Get chain name
export function getChainName(chainId: number) {
  const network = getChainById(chainId);
  return network?.name || 'Unknown Network';
}

// Helper: Check if chain is testnet
export function isTestnet(chainId: number) {
  return [
    optimismSepolia.id,
    sepolia.id,
    polygonAmoy.id,
    celoAlfajores.id,
  ].includes(chainId);
}

// Helper: Get block explorer URL
export function getBlockExplorerUrl(
  chainId: number,
  hash: string,
  type: 'tx' | 'address' = 'tx'
) {
  const network = getChainById(chainId);
  if (!network?.blockExplorers?.default) return '#';

  const baseUrl = network.blockExplorers.default.url;
  return `${baseUrl}/${type}/${hash}`;
}

// Default chain for the app
export const defaultChain = optimismSepolia;

// Export config as default for compatibility
export default wagmiConfig;
